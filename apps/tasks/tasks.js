function main(ctx, session) {
  var tasks = session.tasks = session.tasks || [];
  var render = session.render("tasks");
  render.on({
      "newTask": function(event) {
        var task = ctx.newObj("task").result;
        task.title = (event.node.value || "").trim();
        task.createdAt = task.updatedAt = new Date().toJSON();
        event.node.value = "";
        render.get("tasks").unshift(task);
        render.set({ "obj": task,
                     "edit": false,
                     "comment": false });
        setTimeout(function () { event.node.focus(); }, 0 );
      },
      "showTask": function(event) {
        var task = _.find(tasks,
                          function(task) { return task.createdAt == event.node.id; });
        render.set({ "obj": task,
                     "edit": false,
                     "comment": false });
      },
      "toggleEdit": function() { render.set("edit", !render.get("edit")); },
      "toggleComment": function() { render.set("comment", !render.get("comment")); }
    });
}
