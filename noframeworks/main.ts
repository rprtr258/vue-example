type EffectFn = () => void;
type DisposeFn = () => void;

const effects: EffectFn[] = [() => {}];
const disposed = new WeakSet<EffectFn>();

class Signal<T> {
  v: T;
  subs: Set<EffectFn>;
  constructor(v0: T) {
    this.v = v0;
    this.subs = new Set();
  }
  trigger() {
    for (let eff of this.subs) {
      if (disposed.has(eff)) {
        this.subs.delete(eff);
      } else {
        eff();
      }
    }
  }
  get value(): T {
    this.subs.add(effects.at(-1)!);
    return this.v;
  }
  set value(v: T) {
    if (v === this.v) {
      return
    }

    this.v = v;
    this.trigger();
  }
}
function signal<T>(value: T): Signal<T> {
  return new Signal(value);
}

function effect(fn: EffectFn): DisposeFn {
  effects.push(fn);
  try {
    fn();
    return () => disposed.add(fn);
  } finally {
    effects.pop();
  }
}

function computed<T>(fn: () => T): [Signal<T>, DisposeFn] {
  const s = signal<T>(undefined as T);
  const dispose = effect(() => s.value = fn());
  return [s, dispose];
}

type Value<T> = Signal<T> | (() => T) | T;

function html(tpl: TemplateStringsArray, ...data: Value<unknown>[]): Node[] {
  const marker = "\ufeff";
  const t = document.createElement("template");
  t.innerHTML = tpl.join(marker);
  if (tpl.length > 1) {
    const iter = document.createNodeIterator(t.content, 1 | 4);
    let n, i = 0;
    while ((n = iter.nextNode())) {
      if (n.attributes) {
        for (let attr of [...n.attributes]) {
          if (attr.value == marker) {
            render_element(n, attr.name, data[i] as Value<boolean>);
            i++;
          }
        }
      } else {
        if (n.nodeValue.includes(marker)) {
          let tmp = document.createElement("template");
          tmp.innerHTML = n.nodeValue.replaceAll(marker, "<!>");
          for (let child of tmp.content.childNodes)
            if (child.nodeType == 8) {
              render_child(child, data[i] as Value<string | any[]>);
              i++;
            }
          n.replaceWith(tmp.content);
        }
      }
    }
  }
  return [...t.content.childNodes];
}

function render_run<T>(n: Node, value: Value<T>) {
  return function(fn: (value: T) => void) {
    if (value instanceof Signal) {
      let dispose: DisposeFn | undefined;
      dispose = effect(() =>
        dispose && !n.isConnected ? dispose() : fn(value.value)
      );
    } else if (value instanceof Function) {
      let dispose: DisposeFn | undefined;
      dispose = effect(() =>
        dispose && !n.isConnected ? dispose() : fn(value())
      );
    } else {
      fn(value as T);
    }
  };
}

function render_element(node: Element, attr: string, value: Value<boolean>): void {
  const run = render_run<boolean>(node, value);
  node.removeAttribute(attr);
  if (attr.startsWith("on")) node[attr] = value;
  else
    run((value: boolean) => {
      if (attr == "value" || attr == "checked") {
        node[attr] = value;
      } else {
        !value
          ? node.removeAttribute(attr)
          : node.setAttribute(attr, String(value));
      }
    });
}

function render_child(node: ChildNode, value: Value<string | any[]>): void {
  const run = render_run(node, value);
  const key = Symbol();
  run((value: string | any[]) => {
    const upd: ChildNode[] =
      Array.isArray(value) ? value.flat() :
      value !== undefined ? [document.createTextNode(value)] :
      [];
    for (let n of upd) {
      n[key] = true;
    }
    let a: ChildNode | null = node, b: ChildNode | undefined | null;
    while ((a = a!.nextSibling) && a[key]) {
      b = upd.shift();
      if (a !== b) {
        if (b) {
          a.replaceWith(b);
        } else {
          b = a.previousSibling;
          a.remove();
        }
        a = b;
      }
    }
    if (upd.length) {
      (b || node).after(...upd);
    }
  });
}

function each<T, K>(val: T[] | Signal<T[]>, getKey: (T) => K, tpl: (_0: T, _1: number) => Node[]) {
  let a: (K | null)[] = [];
  let aNodes: ChildNode[] = [];
  return () => {
    const items = val instanceof Signal ? val.value : val;
    const b = items.map(getKey);
    const aIdx = new Map<K, number>(a.map((k, i) => [k!, i]));
    const bIdx = new Map<K, number>(b.map((k, i) => [k, i]));
    const bNodes: ChildNode[] = [];
    for (let i = 0, j = 0; i != a.length || j != b.length; ) {
      let aElm = a[i], bElm = b[j];
      if (aElm === null) {
        i++;
      } else if (b.length <= j) {
        aNodes[i].remove();
        i++;
      } else if (a.length <= i) {
        bNodes.push(tpl(items[j], j)[0] as ChildNode);
        j++;
      } else if (aElm === bElm) {
        bNodes[j] = aNodes[i];
        i++;
        j++;
      } else {
        let oldIdx = aIdx.get(bElm);
        if (bIdx.get(aElm) === undefined) aNodes[i++].remove();
        else if (oldIdx === undefined) {
          bNodes[j] = tpl(items[j], j)[0] as ChildNode;
          aNodes[i].before(bNodes[j++]);
        } else {
          bNodes[j++] = aNodes[oldIdx];
          aNodes[i].before(aNodes[oldIdx]);
          a[oldIdx] = null;
          if (oldIdx > i + 1) {
            i++;
          }
        }
      }
    }
    a = b;
    aNodes = bNodes;
    return [...aNodes];
  };
}









// ------ Todo App ------
{
  type Todo = {
    text: string,
    completed: boolean,
  };
  const todos: Signal<Todo[]> = signal([]);
  const newTodo = signal("");

  function addTodo() {
    if (newTodo.value.trim() === "") {
      return;
    }

    todos.value.push({
      text: newTodo.value,
      completed: false,
    });
    todos.trigger();
    newTodo.value = "";
  };
  function toggleTodo(todo: Todo) {
    todo.completed = !todo.completed;
    todos.trigger();
  };
  function removeTodo(todo: Todo) {
    todos.value = todos.value.filter((item) => item !== todo);
    todos.trigger();
  };
  const [remainingTodos, _] = computed(() => todos.value.filter((todo) => !todo.completed).length);

  const app = html`<div>
    <h1>Todo App</h1>
    <p>${() => /* TODO: fix appending */ todos.value.map(x => JSON.stringify(x))}</p>
    <input
      type="text"
      value=${newTodo}
      oninput=${(e) => newTodo.value = e.target.value}
      placeholder="Add a new todo"
    />
    <button onclick=${addTodo}>Add</button>
    <ul>${each(
      todos,
      (todo) => todo, // Use the whole object as a key
      (todo) => html`<li>
        <input
          type="checkbox"
          checked=${() => todo.completed}
          onchange=${() => toggleTodo(todo)}
        />
        <span
          style=${() => todo.completed ? "text-decoration: line-through" : ""}
        >
          ${todo.text}
        </span>
        <button onclick=${() => removeTodo(todo)}>Remove</button>
      </li>`
    )}</ul>
    <p>${remainingTodos} items left</p>
  </div>`;

  // Mount the app to the DOM
  document.body.append(...app);
}

{
  const count = signal(0);

  const app = html`<div>
    <h1>Counter: ${count}</h1>
    <button onclick=${() => count.value++}>Increment</button>
    <button onclick=${() => count.value--}>Decrement</button>
  </div>`;

  // Mount the app to the DOM
  document.body.append(...app);

  const [double, _] = computed(() => count.value * 2);
  effect(() => {
    const node = document.createElement("p");
    node.innerText = `Count is: ${count.value}, double is ${double.value}`;
    document.body.appendChild(node);
  });
  setTimeout(() => count.value = 1, 1000);
}
