package example;

import java.util.List;

public final class TaskService {
    private final TaskRepository repository;

    public TaskService(TaskRepository repository) {
        this.repository = repository;
    }

    public String listTasks() {
        List<String> tasks = repository.findAll();
        return "[\"" + String.join("\",\"", tasks) + "\"]";
    }
}
