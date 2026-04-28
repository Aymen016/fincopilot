from app.ai.health_scorer import HealthScorer


def test_grade():
    s = HealthScorer()
    assert s._grade(95) == "A+"
    assert s._grade(85) == "A"
    assert s._grade(75) == "B"
    assert s._grade(65) == "C"
    assert s._grade(55) == "D"
    assert s._grade(30) == "F"
