function main(ctx, session) {
  session.statusChoices = session.statusChoices || findStatusChoices(ctx)
  session.tasks = session.tasks || [];
  session.obj = findTask(ctx, session.tasks, session.ident) || session.obj;

  if (!session.r) {
    session.r = session.render("tasks");
  } else {
    session.r.update("tasks");
  }
  renderTask(session.r, session.obj);

  session.r.on({
      "newTask": function(event) {
        var task = ctx.newObj("task").result;
        task.title = (event.node.value || "").trim();
        if (task.title) {
          task.createdAt = task.updatedAt = new Date().toJSON();
          task.ident = "task-" + task.createdAt.replace(/[^0-9]/g, '') +
            Math.round(Math.random() * 10000);
          session.r.get("tasks").unshift(task);
          renderTask(session.r, task);
          event.node.value = "";
          event.node.focus();
        }
      },
      "saveTask": function() {
        var edit = session.r.get("objEdit");
        var orig = findTask(ctx, session.r.get("tasks"), edit.ident);
        _.extend(orig, edit);
        _.each(_.keys(orig), function(k) {
            if (_.isString(orig[k])) { orig[k] = orig[k].trim(); }
          });
        renderTask(session.r, orig);
        session.r.update("tasks");
      },
      "editTask": function() {
        renderTask(session.r, session.r.get("obj"), { "doEdit": !session.r.get("doEdit") });
        if (session.r.get("doEdit")) {
          setTimeout(function() { $("#objEdit_title").focus(); });
        }
      },
      "addComment": function() {
        renderTask(session.r, session.r.get("obj"), { "doComment": !session.r.get("doComment") });
        if (session.r.get("doComment")) {
          setTimeout(function() { $("#commentMessage").focus(); });
        }
      },
      "saveComment": function() {
        var task = session.r.get("obj");
        if (task) {
          var m = (session.r.get("commentMessage") + "").trim();
          if (m) {
            var c = ctx.newObj("taskMessage").result;
            c.createdAt = c.updatedAt = new Date().toJSON();
            c.message = m;
            task.messages = task.messages || [];
            task.messages.push(c);
          }
        }
        renderTask(session.r, task);
      }
    });
}

function findTask(ctx, tasks, ident) {
  return ctx.findObj(where).result || _.find(tasks, where);
  function where(task) { return task.ident == ident; };
}

function renderTask(render, task, extras) {
  render.set(_.defaults(extras || {}, { "obj": task,
                                        "objEdit": _.clone(task),
                                        "doEdit": false,
                                        "doComment": false,
                                        "commentMessage": "" }));
}

function findStatusChoices(ctx) {
  return _.findWhere(ctx.getClassByName("task").result.properties, { "name": "status" }).valueChoices;
}
