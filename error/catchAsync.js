// takes a function as parameter and returns another function
// that catches any error that may be thrown and passes it to next
// so that we don't have to try-catch every async function in our code
// this provides a nicer/cleaner way
module.exports = func => {
    return (req, res, next) => {
        func(req, res, next).catch(next);
    }
}