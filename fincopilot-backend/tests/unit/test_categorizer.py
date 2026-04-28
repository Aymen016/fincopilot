from app.ai.categorizer import ExpenseCategorizer


def test_keyword_match_dining():
    c = ExpenseCategorizer()
    result = c.predict("starbucks latte", "Starbucks", 5.50)
    assert result["category_id"] == "dining"
    assert result["confidence"] > 0.0


def test_keyword_match_groceries():
    c = ExpenseCategorizer()
    result = c.predict("weekly groceries", "Walmart", 87.40)
    assert result["category_id"] == "groceries"


def test_unknown_falls_back():
    c = ExpenseCategorizer()
    result = c.predict("xyz123 unknown", "", 10.0)
    assert "category_id" in result
    assert "confidence" in result
