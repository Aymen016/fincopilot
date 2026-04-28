from app.ai.insights_engine import InsightsEngine, UserStats


def test_high_dining_triggers_overspend():
    engine = InsightsEngine()
    stats = UserStats(dining_pct=0.35, savings_rate=0.15)
    insights = engine.generate(stats)
    types = [i["type"] for i in insights]
    assert "overspend" in types


def test_low_savings_triggers_savings():
    engine = InsightsEngine()
    stats = UserStats(dining_pct=0.10, savings_rate=0.05)
    insights = engine.generate(stats)
    types = [i["type"] for i in insights]
    assert "savings" in types


def test_no_false_triggers():
    engine = InsightsEngine()
    stats = UserStats(dining_pct=0.15, savings_rate=0.20)
    insights = engine.generate(stats)
    assert len(insights) == 0
