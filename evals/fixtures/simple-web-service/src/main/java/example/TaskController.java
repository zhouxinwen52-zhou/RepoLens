package example;

public final class TaskController {
    private final TaskService service;

    public TaskController(TaskService service) {
        this.service = service;
    }

    public String handleGet(String path) {
        if (!"/tasks".equals(path)) {
            return "{\"status\":404}";
        }

        return "{\"status\":200,\"tasks\":" + service.listTasks() + "}";
    }
}
