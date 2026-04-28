from app.utils.csv_parser import parse_csv


SAMPLE_CSV = """date,amount,description,merchant
2026-04-01,42.50,Coffee meeting,Starbucks
2026-04-02,12.99,Spotify subscription,Spotify
2026-04-03,-5.00,Refund,Amazon
bad_date,10.00,Missing date,
"""


def test_parse_valid_rows():
    expenses, errors = parse_csv(SAMPLE_CSV)
    assert len(expenses) == 2
    assert expenses[0].amount == 42.50
    assert expenses[0].merchant == "Starbucks"


def test_parse_negative_and_invalid():
    expenses, errors = parse_csv(SAMPLE_CSV)
    assert any("must be positive" in e or "Unrecognized date" in e for e in errors)
