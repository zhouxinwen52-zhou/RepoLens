package example;

import java.util.List;

public final class TaskRepository {
    public List<String> findAll() {
        return List.of("read-spec", "run-tests");
    }
}
