class IncidentPlanner:
    def choose_action(self, alert: str) -> str:
        if "latency" in alert.lower():
            return "inspect_database_metrics"
        return "inspect_service_logs"
