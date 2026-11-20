package relay;

public final class Main {
    private Main() {}

    public static void main(String[] args) {
        RiskWorker worker = new RiskWorker("workers/risk_score.py");
        EnvelopeRelay relay = new EnvelopeRelay(new RouteGraph(), worker);
        System.out.println(relay.accept("payment", "amount=1200"));
    }
}
