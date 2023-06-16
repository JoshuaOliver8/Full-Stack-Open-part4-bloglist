const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const middleware = require('../utils/middleware')

blogsRouter.get('/', async (request, response) => {
	const blogs = await Blog
		.find({}).populate('user', { username: 1, name: 1 })
	response.json(blogs)
})

blogsRouter.get('/:id', async (request, response) => {
	const blog = await Blog.findById(request.params.id)
	if (blog) {
		response.json(blog)
	} else {
		response.status(404).end()
	}
})

blogsRouter.post('/', [middleware.userExtractor], async (request, response) => {
	const body = request.body
	const user = request.user

	const blog = new Blog({
		title: body.title,
		author: user.name,
		url: body.url,
		likes: body.likes,
		user: user.id
	})

	const savedBlog = await blog.save()
	user.blogs = user.blogs.concat(savedBlog._id)
	await user.save()

	response.status(201).json(savedBlog)
})

blogsRouter.delete('/:id', [middleware.userExtractor], async (request, response) => {
	const user = request.user
	const blog = await user.blogs.find(b => b.toString() === request.params.id)

	if (!blog) {
		return response.status(401).json({ error: 'only the blog creator can delete the blog' })
	}
	
	await Blog.findByIdAndRemove(request.params.id)
	response.status(204).end()
})

blogsRouter.put('/:id', (request, response, next) => {
	const body = request.body
  
	const blog = {
	  title: body.title,
	  author: body.author,
	  url: body.url,
	  likes: body.likes,
	}
  
	Blog.findByIdAndUpdate(request.params.id, blog, { new: true })
	  .then(updatedBlog => {
		response.json(updatedBlog)
	  })
	  .catch(error => next(error))
})

module.exports = blogsRouter