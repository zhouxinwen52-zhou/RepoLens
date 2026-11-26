package relay;

public final class RiskWorker {
    private final String scriptPath;

    public RiskWorker(String scriptPath) {
        this.scriptPath = scriptPath;
    }

    public int score(String payload) {
        // The fixture models the subprocess boundary without executing it.
        return payload.contains("amount=1200") && scriptPath.endsWith("risk_score.py") ? 80 : 10;
    }
}
