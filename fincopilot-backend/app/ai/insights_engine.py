from dataclasses import dataclass, field


SEVERITY_ORDER = {"high": 0, "medium": 1, "low": 2}


@dataclass
class UserStats:
    dining_pct: float = 0.0
    savings_rate: float = 0.0
    weekend_vs_weekday: float = 1.0
    recurring_detected: bool = False
    recurring_count: int = 0
    recurring_amount: float = 0.0
    monthly_totals: list[float] = field(default_factory=list)
    budget_adherence: float = 1.0
    top_category_name: str = "Other"
    top_category_delta: float = 0.0
    budget_overspend: bool = False
    budget_overspend_cats_str: str = ""
    spending_trending_up: bool = False
    monthly_increase_pct: float = 0.0


class InsightsEngine:
    RULES = [
        (
            lambda s: s.dining_pct > 0.25,
            "overspend", "high",
            "Food & dining is eating up {dining_pct:.0%} of your spending. Consider a strict food budget to free up cash for savings.",
        ),
        (
            lambda s: s.savings_rate < 0.10,
            "savings", "medium",
            "Your savings rate is only {savings_rate:.0%} — below the recommended 10%. Try automating a small monthly transfer to savings.",
        ),
        (
            lambda s: s.weekend_vs_weekday > 1.8,
            "pattern", "low",
            "Weekend spending is {weekend_vs_weekday:.1f}× your weekday average. Planning weekend activities in advance can help curb impulse spending.",
        ),
        (
            lambda s: s.recurring_detected,
            "subscription", "medium",
            "Found {recurring_count} recurring charges totalling PKR {recurring_amount:.0f}/mo. Review these for unused or duplicate subscriptions.",
        ),
        (
            lambda s: s.budget_overspend,
            "overspend", "high",
            "You've exceeded your budget in: {budget_overspend_cats_str}. Adjust limits or cut spending in those categories.",
        ),
        (
            lambda s: s.spending_trending_up and s.monthly_increase_pct > 0.15,
            "forecast", "medium",
            "Spending has increased {monthly_increase_pct:.0%} over the last 3 months — if the trend continues, you may miss your savings targets.",
        ),
        (
            lambda s: s.budget_adherence < 0.5 and not s.budget_overspend,
            "overspend", "medium",
            "Only {budget_adherence_pct:.0f}% of your budget categories are on track. Review your spending limits.",
        ),
    ]

    def generate(self, stats: UserStats) -> list[dict]:
        triggered = [
            (itype, sev, tmpl)
            for (rule, itype, sev, tmpl) in self.RULES
            if rule(stats)
        ]
        triggered.sort(key=lambda x: SEVERITY_ORDER[x[1]])

        insights = []
        for itype, severity, template in triggered[:6]:
            body = template.format(
                dining_pct=stats.dining_pct,
                savings_rate=stats.savings_rate,
                weekend_vs_weekday=stats.weekend_vs_weekday,
                recurring_count=stats.recurring_count,
                recurring_amount=stats.recurring_amount,
                budget_overspend_cats_str=stats.budget_overspend_cats_str,
                monthly_increase_pct=stats.monthly_increase_pct,
                budget_adherence_pct=stats.budget_adherence * 100,
            )
            insights.append({
                "type": itype,
                "severity": severity,
                "title": self._title(itype, severity),
                "body": body,
            })
        return insights

    def _title(self, itype: str, severity: str) -> str:
        titles = {
            "overspend": "Overspending Alert" if severity == "high" else "Budget Warning",
            "savings": "Low Savings Rate",
            "pattern": "Spending Pattern Detected",
            "subscription": "Subscription Review",
            "goal": "Goal Progress",
            "forecast": "Spending Trend Alert",
        }
        return titles.get(itype, "Financial Insight")
