package relay;

public final class RouteGraph {
    public String route(String channel) {
        return switch (channel) {
            case "payment" -> "manual-review";
            default -> "archive";
        };
    }
}
