/*
 * Vue3 响应式原理 (Vue 3 Reactivity) - Vue Mastery
 * https://www.bilibili.com/video/BV1SZ4y1x7a9/
 * run `node reactivity.js`
 */

/*
 * targetMap: WeakMap (因为key是目标object), value 是 depsMap
 * depsMap: store the dependency object for each property, key 是目标对象的属性，value 是 dep
 * dep: A dependency which is a set of effects that should get re-run when values change
 */
const targetMap = new WeakMap()

// 只在首次跟踪，否则每次obj.get都会执行运行track()
let activeEffect = null

function effect(eff) {
  activeEffect = eff
  activeEffect()  // eff 必定含有obj.get操作，从而加入track()
  activeEffect = null
}

function track(target, key) {
  if (activeEffect) {
    let depsMap = targetMap.get(target)
    if (!depsMap) {
      targetMap.set(target, (depsMap = new Map()))
    }
    let dep = depsMap.get(key)
    if (!dep) {
      depsMap.set(key, (dep = new Set()))
    }
    dep.add(activeEffect)
  }
}

function trigger(target, key) {
  let depsMap = targetMap.get(target)
  if (!depsMap) { return }
  let dep = depsMap.get(key)
  if (dep) {
    dep.forEach(effect => {
      effect()
    })
  }
}

// 通过 Proxy 和 Reflect 实现了 reactive
function reactive(target) {
  const handler = {
    get(target, key, receiver) {
      let result = Reflect.get(target, key, receiver)
      track(target, key)
      return result
    },
    set(target, key, value, receiver) {
      let oldValue = target[key]
      let result = Reflect.set(target, key, value, receiver)
      if (oldValue !== value) {
        // 当设置了新值，触发依赖函数集合的更新
        trigger(target, key)
      }
      return result
    },
  }
  return new Proxy(target, handler)
}

/*
 * 也可以通过 reactive 来实现 ref
 * function ref(value) {
 *   return reactive({ value: value })
 * }
 * Vue 是用 Object Accessors 实现的
 */
function ref(raw) {
  const r = {
    get value() {
      track(r, 'value')
      return raw
    },
    set value(newVal) {
      if (raw !== newVal) {
        raw = newVal
        trigger(r, 'value')
      }
    },
  }
  return r
}

function computed(getter) {
  let result = ref()
  effect(() => {
    result.value = getter()
  })
  return result
}


/* Test */
let product = reactive({ price: 5, quantity: 2 })
let salePrice = computed(() => {
  return product.price * 0.9
})
let total = computed(() => {
  return salePrice.value * product.quantity
})
console.log(total.value === 9)

product.price = 10
product.quantity = 3
console.log(total.value === 27)
