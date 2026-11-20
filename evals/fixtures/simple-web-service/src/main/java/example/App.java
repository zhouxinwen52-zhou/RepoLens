package example;

public final class App {
    private App() {}

    public static void main(String[] args) {
        TaskRepository repository = new TaskRepository();
        TaskService service = new TaskService(repository);
        TaskController controller = new TaskController(service);

        System.out.println(controller.handleGet("/tasks"));
    }
}
