// eslint-disable-next-line no-unused-vars
const dummy = (blogs) => {
	return 1
}

const totalLikes = (blogs) => {
    const reducer = (sum, blog) => {
        return sum + blog.likes
    }

    return blogs.reduce(reducer, 0)
}

const favoriteBlog = (blogs) => {
    if (blogs.length === 0) {
        return []
    }
    
    let maxLikes = 0
    const reducer = (max, blog) => {
        if (maxLikes < blog.likes) {
            maxLikes = blog.likes
            max = blog
        }
        return max
    }

    return blogs.reduce(reducer, 0)
}

module.exports = {
	dummy,
    totalLikes,
    favoriteBlog
}