function start(ctx, ui) {
  var tasks = ui.tasks = ui.tasks || [];
  var ractive = ui.render("tasks");
  ractive.on({
      "newTask": function(event) {
        var task = ctx.newObj("task").result;
        task.title = event.node.value;
        task.createdAt = task.updatedAt = new Date().toJSON();
        event.node.value = "";
        ractive.get("tasks").unshift(task);
        ractive.set("obj", task);
        setTimeout(function () { event.node.focus(); }, 0 );
      },
      "showTask": function(event) {
        ractive.set("obj", _.find(tasks, function(task) {
              return task.title == event.node.text;
            }));
      },
    });
}
