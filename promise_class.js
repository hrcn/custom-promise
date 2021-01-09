class Promise {
  constructor(executor) {
    this.PromiseState = 'pending';
    this.PromiseResult = null;
    this.callbacks = [];
    const self = this;

    function resolve(data) {
      if (self.PromiseState !== 'pending') return;
      self.PromiseState = 'fulfilled';
      self.PromiseResult = data;
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
  
    try {
      executor(resolve, reject);
    } catch(e) {
      reject(e);
    }
  }

  then(onResolved, onRejected) {
    const self = this;

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
      function callback(type) {
        try {
          let result = type(self.PromiseResult);
          if (result instanceof Promise) {
            result.then(v => {
              resolve(v);
            }, r => {
              reject(r);
            })
          } else {
            resolve(result);
          }
        } catch(e) {
          reject(e);
        }
      }
      if (this.PromiseState === 'fulfilled') {
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

  catch(onRejected) {
    return this.then(undefined, onRejected);
  }

  // 静态成员，属于类，而不属于实例对象
  static resolve(value) {
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

  static reject(reason) {
    return new Promise((undefined, reject) => {
      reject(reason);
    })
  }

  static all(promises) {
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

  static race(promises) {
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
}