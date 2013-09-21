function start(ir) {
  var ctx = ir.data.ctx;
  var tasks = ir.data.tasks = [];
  var ractive = ir.data.render("welcome");
  ractive.on({
      "newTask": function(event) {
        var task = ctx.newObj("task").result;
        task.task = event.node.value;
        event.node.value = "";
        ractive.get("tasks").unshift(task);
        setTimeout(function () { event.node.focus(); }, 0 );
        }
    });
}
