function start(ctx, ui) {
  var tasks = ui.tasks = ui.tasks || [];
  var ractive = ui.render("welcome");
  ractive.on({
      "newTask": function(event) {
        var task = ctx.newObj("task").result;
        task.title = event.node.value;
        console.log(task);
        event.node.value = "";
        ractive.get("tasks").unshift(task);
        ractive.set("obj", task);
        setTimeout(function () { event.node.focus(); }, 0 );
      }
    });
}
