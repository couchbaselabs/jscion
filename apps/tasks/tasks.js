function main(ctx, page) {
  page.statusChoices = page.statusChoices || findStatusChoices(ctx)
  page.tasks = page.tasks || [];
  page.taskCountsByStatus = page.taskCountsByStatus || {};
  page.obj = findTask(ctx, page.tasks, page.ident) || page.obj;

  if (!page.r || page.controller != page.prev.controller) {
    page.r = page.render("tasks");
    page.r.on({
      "newTask": function(event) {
        var task = ctx.newObj("task", { "title": (event.node.value || "").trim() }).result;
        if (task.title) {
          page.r.get("tasks").unshift(task);
          renderTask(ctx, page.r, task);
          event.node.value = "";
          event.node.focus();
        }
      },
      "saveTask": function() {
        var edit = page.r.get("objEdit");
        updateTask(ctx, page, findTask(ctx, page.r.get("tasks"), edit.ident), edit);
      },
      "editTask": function() {
        renderTask(ctx, page.r, page.r.get("obj"), { "doEdit": !page.r.get("doEdit") });
        if (page.r.get("doEdit")) {
          setTimeout(function() { $("#objEdit_title").focus(); });
        }
      },
      "cloneTask": function() {
        var orig = page.r.get("obj");
        var task = ctx.newObj("task", { "title": orig.title,
                                        "description": orig.description }).result;
        page.r.get("tasks").unshift(task);
        renderTask(ctx, page.r, task);
      },
      "addComment": function() {
        renderTask(ctx, page.r, page.r.get("obj"), { "doComment": !page.r.get("doComment") });
        if (page.r.get("doComment")) {
          setTimeout(function() { $("#commentMessage").focus(); });
        }
      },
      "saveComment": function() {
        var msg = (page.r.get("commentMessage") + "").trim();
        var task = page.r.get("obj");
        if (task && msg) {
          var c = ctx.newChild(task, "messages", { "message": msg }).result;
          c.createdAt = c.updatedAt = new Date().toJSON();
        }
        renderTask(ctx, page.r, task);
      },
      "deleteMessage": function(event) {
        var task = page.r.get("obj");
        task.messages.splice(parseInt(event.node.value), 1);
        renderTask(ctx, page.r, task);
      },
      "changeTaskStatus": function(event) {
        var edit = page.r.get("objEdit");
        var newStatus =
          (_.findWhere((ctx.getObj("stateMachine-taskStatus").result || {}).transitions || [],
                       { "from": edit.status, "on": event.node.value }) || {}).to;
        if (newStatus) {
          edit.status = newStatus;
          updateTask(ctx, page, findTask(ctx, page.r.get("tasks"), edit.ident), edit,
                     ", to " + newStatus);
        }
      }
    });
  }

  page.r.update("tasks");
  page.r.update("tasksByStatus");
  renderTask(ctx, page.r, page.obj);
}

function findTask(ctx, tasks, ident) {
  return ctx.findObj(where).result || _.find(tasks, where);
  function where(task) { return task.ident == ident; };
}

function renderTask(ctx, r, task, extras) {
  r.set(_.defaults(extras || {}, { "obj": task,
                                   "objEdit": _.clone(task),
                                   "doEdit": false,
                                   "doComment": false,
                                   "commentMessage": "" }));
  r.set("objJSON", JSON.stringify(r.get("obj")));
  r.set("taskCountsByStatus", _.countBy(r.get("tasks"), "status"));
  r.set("taskStatusTransitions",
        task && _.filter((ctx.getObj("stateMachine-taskStatus").result || {}).transitions || [],
                         function(t) { return t.from == task.status; }));
}

function findStatusChoices(ctx) {
  return _.findWhere(ctx.getClassByName("task").result.properties, { "name": "status" }).valueChoices;
}

function updateTask(ctx, page, orig, edit, msgSuffix) {
  var changes = _.compact(_.map(_.keys(orig), function(k) { return (orig[k] != edit[k]) && k; }));
  if (changes.length > 0) {
    edit.updatedAt = new Date().toJSON();
    _.extend(orig, edit);
    _.each(_.keys(orig), function(k) {
        if (_.isString(orig[k])) { orig[k] = orig[k].trim(); }
      });
    var m = "(" + changes.join(", ") + " edited" + (msgSuffix || "") + ")";
    var c = ctx.newChild(orig, "messages", { "message": m }).result;
    c.createAt = c.updatedAt = new Date().toJSON();
  }
  renderTask(ctx, page.r, orig);
  page.r.update("tasks");
}
