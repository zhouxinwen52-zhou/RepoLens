class IncidentTools:
    def execute(self, action: str) -> str:
        observations = {
            "inspect_database_metrics": "connection pool saturation at 92%",
            "inspect_service_logs": "no recent application errors",
        }
        return observations[action]
