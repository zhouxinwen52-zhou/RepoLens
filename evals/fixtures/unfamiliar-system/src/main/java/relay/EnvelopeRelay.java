package relay;

public final class EnvelopeRelay {
    private final RouteGraph graph;
    private final RiskWorker worker;

    public EnvelopeRelay(RouteGraph graph, RiskWorker worker) {
        this.graph = graph;
        this.worker = worker;
    }

    public String accept(String channel, String payload) {
        String route = graph.route(channel);
        int score = worker.score(payload);
        return route + ":risk=" + score;
    }
}
