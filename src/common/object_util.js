'use strict';

const merge_object = (object, to_merge) => {
  var copy = JSON.parse(JSON.stringify(object));
  Object.keys(to_merge).forEach( property => {
      if (copy[property] instanceof Object){
        copy[property] = merge_object(copy[property], to_merge[property])
      }else{
        copy[property] = to_merge[property]
      }
  })
  return copy
}

module.exports={
  merge_object
}
