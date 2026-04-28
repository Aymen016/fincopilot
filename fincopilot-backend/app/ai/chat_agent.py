import json
import httpx
from typing import AsyncGenerator
from datetime import date, timedelta
from collections import defaultdict

OLLAMA_BASE = "http://localhost:11434"
MODEL = "llama3.2"

SYSTEM_PROMPT = """You are FinCopilot, a personal AI financial assistant for a Pakistani user. \
Answer questions strictly using the financial data provided below. Be specific, cite PKR amounts, \
keep responses under 120 words unless the user asks for detail.

=== USER FINANCIAL DATA ===
{context}
=== END DATA ===

Rules:
- Only reference data shown above. Never invent numbers.
- All amounts are in PKR.
- Be encouraging but honest about financial challenges.
- If data is insufficient, say so and suggest what to add."""


class ChatAgent:
    def __init__(self, user_id: str, session):
        self.user_id = user_id
        self.session = session
        self.history: list[dict] = []

    async def _build_context(self) -> str:
        from uuid import UUID
        from sqlalchemy import select
        from sqlalchemy.orm import selectinload
        from app.models.expense import Expense
        from app.models.budget import Budget
        from app.models.goal import SavingsGoal
        from app.models.user import User

        uid = UUID(self.user_id)
        now = date.today()
        month_start = date(now.year, now.month, 1)
        ninety_ago = now - timedelta(days=90)

        # User income
        user_res = await self.session.execute(select(User).where(User.id == uid))
        user = user_res.scalar_one_or_none()

        # Last 90 days expenses
        exp_res = await self.session.execute(
            select(Expense)
            .options(selectinload(Expense.category))
            .where(Expense.user_id == uid, Expense.expense_date >= ninety_ago)
            .order_by(Expense.expense_date.desc())
            .limit(150)
        )
        expenses = exp_res.scalars().all()

        # Budgets this month
        bud_res = await self.session.execute(
            select(Budget)
            .options(selectinload(Budget.category))
            .where(Budget.user_id == uid, Budget.month == now.month, Budget.year == now.year)
        )
        budgets = bud_res.scalars().all()

        # Active goals
        goal_res = await self.session.execute(
            select(SavingsGoal).where(SavingsGoal.user_id == uid, SavingsGoal.is_active == True)
        )
        goals = goal_res.scalars().all()

        lines = [f"Date: {now.strftime('%B %d, %Y')}"]

        if user and user.monthly_income:
            lines.append(f"Monthly income: PKR {user.monthly_income:,.0f}")

        month_expenses = [e for e in expenses if e.expense_date >= month_start]
        if month_expenses:
            month_total = sum(e.amount for e in month_expenses)
            lines.append(f"\nThis month total spending: PKR {month_total:,.0f}")
            cat_totals: dict[str, float] = defaultdict(float)
            for e in month_expenses:
                cat_totals[e.category.name if e.category else "Other"] += e.amount
            lines.append("Breakdown by category:")
            for cat, amt in sorted(cat_totals.items(), key=lambda x: -x[1]):
                lines.append(f"  {cat}: PKR {amt:,.0f}")

        if expenses[:15]:
            lines.append("\nRecent transactions:")
            for e in expenses[:15]:
                lines.append(
                    f"  {e.expense_date} | {e.description} | "
                    f"{e.category.name if e.category else 'Other'} | PKR {e.amount:,.0f}"
                )

        if budgets:
            lines.append("\nBudgets this month:")
            for b in budgets:
                spent = sum(e.amount for e in month_expenses if e.category_id == b.category_id)
                status = "OVER BUDGET" if spent > b.amount_limit else "within limit"
                cat_name = b.category.name if b.category else "?"
                lines.append(
                    f"  {cat_name}: spent PKR {spent:,.0f} / limit PKR {b.amount_limit:,.0f} [{status}]"
                )

        if goals:
            lines.append("\nSavings goals:")
            for g in goals:
                pct = (g.current_amount / g.target_amount * 100) if g.target_amount > 0 else 0
                days_left = (g.target_date - now).days if g.target_date else "?"
                lines.append(
                    f"  {g.name}: PKR {g.current_amount:,.0f} / PKR {g.target_amount:,.0f} "
                    f"({pct:.0f}%) — {days_left} days left"
                )

        return "\n".join(lines)

    async def stream_response(self, message: str) -> AsyncGenerator[str, None]:
        try:
            context = await self._build_context()
            system = SYSTEM_PROMPT.format(context=context)
            self.history.append({"role": "user", "content": message})

            messages = [{"role": "system", "content": system}] + self.history[-10:]

            async with httpx.AsyncClient(timeout=120) as client:
                async with client.stream(
                    "POST",
                    f"{OLLAMA_BASE}/api/chat",
                    json={"model": MODEL, "messages": messages, "stream": True,
                          "options": {"temperature": 0.6, "num_predict": 350}},
                ) as resp:
                    if resp.status_code != 200:
                        yield "Ollama is not running. Start it with: `ollama serve`"
                        return

                    full = ""
                    async for line in resp.aiter_lines():
                        if not line:
                            continue
                        try:
                            data = json.loads(line)
                            chunk = data.get("message", {}).get("content", "")
                            if chunk:
                                full += chunk
                                yield chunk
                            if data.get("done"):
                                break
                        except json.JSONDecodeError:
                            continue

                    if full:
                        self.history.append({"role": "assistant", "content": full})

        except httpx.ConnectError:
            yield "Ollama is not running. Please open a terminal and run: `ollama serve`"
        except Exception as e:
            yield f"Error: {str(e)}"
