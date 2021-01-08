// 声明构造函数
function Promise(executor) {
  // 添加属性
  this.PromiseState = 'pending';
  this.PromiseResult = null;
  // 保存回调函数
  this.callbacks = [];
  // 保存实例对象的 this 值
  const self = this;

  function resolve(data) {
    // this 默认指向 window，需使用保存的 self
    // Promise 状态只能更改一次
    if (self.PromiseState !== 'pending') return;
    // 修改对象状态 PromiseState
    self.PromiseState = 'fulfilled'; // or resolved
    // 设置对象结果值 PromiseResult
    self.PromiseResult = data;
    // 执行成功的回调函数
    setTimeout(() => {
      self.callbacks.forEach(item => {
        item.onResolved(data);
      })
    });
  }

  function reject(data) {
    if (self.PromiseState !== 'pending') return;
    self.PromiseState = 'rejected';
    self.PromiseResult = data;
    setTimeout(() => {
      self.callbacks.forEach(item => {
        item.onRejected(data);
      })
    });
  }
  
  // 用 try catch 处理 throw
  try {
    // 同步调用执行器函数
    executor(resolve, reject);
  } catch(e) {
    // 修改 Promise 对象状态为失败
    reject(e);
  }
}

// 添加 then 方法
Promise.prototype.then = function(onResolved, onRejected) {
  const self = this;

  // 判断回调函数参数
  // 实现异常穿透
  if (typeof onRejected !== 'function') {
    onRejected = reason => {
      throw reason;
    }
  }
  if (typeof onResolved !== 'function') {
    onResolved = value => {
      return value;
    }
  }

  return new Promise((resolve, reject) => {
    // 封装 callback 函数
    function callback(type) {
      try {
        // 获取回调函数的执行结果
        let result = type(self.PromiseResult);
        // 判断 result 类型
        if (result instanceof Promise) {
          // 如果是 Promise 对象
          result.then(v => {
            resolve(v);
          }, r => {
            reject(r);
          })
        } else {
          // 结果的对象状态为成功
          resolve(result);
        }
      } catch(e) {
        reject(e);
      }
    }
    // this 指向实例对象 p
    if (this.PromiseState === 'fulfilled') {
      // 异步执行,需要用setTimeout转换成异步函数
      setTimeout(() => {
        callback(onResolved); 
      });
    }
    if (this.PromiseState === 'rejected') {
      setTimeout(() => {
        callback(onRejected); 
      });
    }
    if (this.PromiseState === 'pending') {
      // 保存回调函数
      this.callbacks.push({
        onResolved: function() {
          callback(onResolved);
        },
        onRejected: function() {
          callback(onRejected);
        }
      });
    }
  })
}

// 添加 catch 方法
Promise.prototype.catch = function(onRejected) {
  return this.then(undefined, onRejected);
}

// 添加 resolve 方法
// 该方法属于 Promise 函数对象, 而不是实例对象
Promise.resolve = function(value) {
  return new Promise((resolve, reject) => {
    if (value instanceof Promise) {
      value.then(v => {
        resolve(v);
      }, r => {
        reject(r);
      })
    } else { 
      resolve(value);
    }
  });
}

// 添加 reject 方法
Promise.reject = function(reason) {
  return new Promise((undefined, reject) => {
    reject(reason);
  })
}

// 添加 all 方法
Promise.all = function(promises) {
  return new Promise((resolve, reject) => {
    let count = 0;
    let result_arr = [];
    for (let i = 0; i < promises.length; i++) {
      promises[i].then(v => {
        count++;
        // 将当前 promise 对象成功的结果存入到数组中
        result_arr[i] = v;
        // 当所有的 promise 都为成功
        if (count === promises.length) {
          resolve(result_arr);
        }
      }, r => {
        reject(r);
      })
    }
    resolve();
  })
}

// 添加 race 方法
Promise.race = function(promises) {
  return new Promise((resolve, reject) => {
    for (let i = 0; i < promises.length; i++) {
      promises[i].then(v => {
        resolve(v);
      }, r => {
        reject(r);
      })
    }
  })
}