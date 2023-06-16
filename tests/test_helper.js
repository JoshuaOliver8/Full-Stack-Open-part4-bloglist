const Blog = require('../models/blog')
const User = require('../models/user')

const initialBlogs = [
    {
        title: 'JavaScript 101',
        author: "Nisio Isin",
        url: "21stjumpstreet.gov",
        likes: 450
    },
    {
        title: 'Jave 1322',
        author: "Hirohiko Araki",
        url: "ooprinciples.net",
        likes: 67
    }
]

const nonExistingId = async () => {
    const blog = new Blog({ 
        title: "PLACEHOLDER",
        author: "PLACEHOLDER",
        url: "PLACEHOLDER",
        likes: 0 
    })
    await blog.save()
    await blog.deleteOne()

    return blog._id.toString()
}

const BlogsInDb = async () => {
    const blogs = await Blog.find({})
    return blogs.map(blog => blog.toJSON())
}

const usersInDb = async () => {
    const users = await User.find({})
    return users.map(u => u.toJSON())
}

module.exports = {
    initialBlogs, nonExistingId, BlogsInDb, usersInDb
}