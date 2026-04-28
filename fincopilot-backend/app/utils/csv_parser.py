import csv
import io
from datetime import datetime
from dataclasses import dataclass


@dataclass
class ParsedExpense:
    amount: float
    description: str
    merchant: str | None
    expense_date: str
    raw_row: dict


def parse_csv(content: str) -> tuple[list[ParsedExpense], list[str]]:
    expenses = []
    errors = []

    try:
        reader = csv.DictReader(io.StringIO(content))
    except Exception as e:
        return [], [f"CSV parse error: {e}"]

    date_formats = ["%Y-%m-%d", "%m/%d/%Y", "%d/%m/%Y", "%m-%d-%Y"]

    for i, row in enumerate(reader, start=2):
        try:
            amount_raw = row.get("amount") or row.get("Amount") or row.get("AMOUNT", "")
            amount = float(str(amount_raw).replace("$", "").replace(",", "").strip())
            if amount <= 0:
                raise ValueError("Amount must be positive")

            description = (row.get("description") or row.get("Description") or
                           row.get("memo") or row.get("Memo") or "").strip()
            if not description:
                raise ValueError("Missing description")

            date_raw = (row.get("date") or row.get("Date") or row.get("DATE") or "").strip()
            parsed_date = None
            for fmt in date_formats:
                try:
                    parsed_date = datetime.strptime(date_raw, fmt).date().isoformat()
                    break
                except ValueError:
                    continue
            if not parsed_date:
                raise ValueError(f"Unrecognized date format: {date_raw}")

            merchant = (row.get("merchant") or row.get("Merchant") or
                        row.get("payee") or row.get("Payee") or "").strip() or None

            expenses.append(ParsedExpense(
                amount=abs(amount),
                description=description,
                merchant=merchant,
                expense_date=parsed_date,
                raw_row=dict(row),
            ))
        except Exception as e:
            errors.append(f"Row {i}: {e}")

    return expenses, errors
