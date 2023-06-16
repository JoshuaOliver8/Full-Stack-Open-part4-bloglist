const mongoose = require('mongoose')
const supertest = require('supertest')
const helper = require('./test_helper')
const app = require('../app')
const api = supertest(app)
const Blog = require('../models/blog')
const bcrypt = require ('bcrypt')
const User = require('../models/user')

beforeEach(async () => {
    await Blog.deleteMany({})

    let blogObject = new Blog(helper.initialBlogs[0])
    await blogObject.save()

    blogObject = new Blog(helper.initialBlogs[1])
    await blogObject.save()
})

test('blogs are returned as json', async () => {
    await api
        .get('/api/blogs')
        .expect(200)
        .expect('Content-Type', /application\/json/)
})

test('all blogs are returned', async () => {
    const response = await api.get('/api/blogs')

    expect(response.body).toHaveLength(helper.initialBlogs.length)
})

test('unique identifier of the blogs is named id', async () => {
    const response = await api.get('/api/blogs')

    expect(response.body[0].id).toBeDefined()
})

test('an HTTP POST request to /api/blogs creates a new blog post', async () => {
    const newBlog = {
        title: 'Top 5 Asymmetric Board Games',
        author: 'Murkyloc',
        url: 'finalfantasyxiv.com',
        likes: 123
    }

    await api
        .post('/api/blogs')
        .send(newBlog)
        .expect(201)
        .expect('Content-Type', /application\/json/)
    
    const blogsAtEnd = await helper.BlogsInDb()
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)

    const titles = blogsAtEnd.map(b => b.title)
    expect(titles).toContain(
        'Top 5 Asymmetric Board Games'
    )
})

test('verifies if likes are not set, they will default to 0', async () => {
    const newBlog = {
        title: 'Top 5 Asymmetric Board Games',
        author: 'Murkyloc',
        url: 'finalfantasyxiv.com'
    }

    await api
        .post('/api/blogs')
        .send(newBlog)
        .expect(201)
        .expect('Content-Type', /application\/json/)
    
    const blogsAtEnd = await helper.BlogsInDb()
    const addedBlog = blogsAtEnd.find(b => b.title === newBlog.title)
    
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)
    expect(addedBlog.likes).toBe(0)
})

test('blog without title or url is not added', async () => {
    const newBlog = {
        author: 'Murkyloc',
        likes: 123
    }

    await api
        .post('/api/blogs')
        .send(newBlog)
        .expect(400)

    const blogsAtEnd = await helper.BlogsInDb()
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
})

test('successfully delete a blog with status code 204 if id is valid', async () => {
    const blogsAtStart = await helper.BlogsInDb()
    const blogToDelete = blogsAtStart[0]

    await api
        .delete(`/api/blogs/${blogToDelete.id}`)
        .expect(204)

    const blogsAtEnd = await helper.BlogsInDb()

    expect(blogsAtEnd).toHaveLength(
        helper.initialBlogs.length - 1
    )

    const titles = blogsAtEnd.map(b => b.title)

    expect(titles).not.toContain(blogToDelete.title)
})

test('successfully updated an existing blog', async () => {
    const blogsAtStart = await helper.BlogsInDb()
    const blogBeforeChange = blogsAtStart[0]

    const newBlog = {
        title: 'JavaScript 101',
        author: "Nisio Isin",
        url: "21stjumpstreet.gov",
        likes: 827
    }

    await api
        .put(`/api/blogs/${blogBeforeChange.id}`)
        .send(newBlog)
        .expect(200)
        .expect('Content-Type', /application\/json/)

    const blogsAtEnd = await helper.BlogsInDb()
    const blogAfterChange = blogsAtEnd.find(b => b.id === blogBeforeChange.id)
    expect(blogAfterChange).not.toEqual(blogBeforeChange)
})

describe('testing users in database', () => {
    beforeEach(async () => {
        await User.deleteMany({})

        const passwordHash = await bcrypt.hash('sekret', 10)
        const user = new User({ username: 'root', passwordHash })

        await user.save()
    })

    test('unique username and valid password creates a new user', async () => {
        const usersAtStart = await helper.usersInDb()

        const newUser = {
            username: 'jaja21',
            name: 'James Franco',
            password: 'password',
        }

        await api
            .post('/api/users')
            .send(newUser)
            .expect(201)
            .expect('Content-Type', /application\/json/)

        const usersAtEnd = await helper.usersInDb()
        expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)

        const usernames = usersAtEnd.map(u => u.username)
        expect(usernames).toContain(newUser.username)
    })

    test('proper error is called if username is already taken', async () => {
        const usersAtStart = await helper.usersInDb()
    
        const newUser = {
            username: 'root',
            name: 'NOT James Franco',
            password: 'password',
        }
    
        const result = await api
            .post('/api/users')
            .send(newUser)
            .expect(400)
            .expect('Content-Type', /application\/json/)
    
        expect(result.body.error).toContain('expected `username` to be unique')
    
        const usersAtEnd = await helper.usersInDb()
        expect(usersAtEnd).toEqual(usersAtStart)
    })

    test('proper error is called if username is too short', async () => {
        const usersAtStart = await helper.usersInDb()
    
        const newUser = {
            username: 'ja',
            name: 'NOT James Franco',
            password: 'password',
        }
    
        const result = await api
            .post('/api/users')
            .send(newUser)
            .expect(400)
            .expect('Content-Type', /application\/json/)
    
        expect(result.body.error).toContain(`User validation failed: username: Path \`username\` (\`${newUser.username}\`) is shorter than the minimum allowed length (3).`)
    
        const usersAtEnd = await helper.usersInDb()
        expect(usersAtEnd).toEqual(usersAtStart)
    })

    test('proper error is called if username is missing', async () => {
        const usersAtStart = await helper.usersInDb()
    
        const newUser = {
            name: 'NOT James Franco',
            password: 'password',
        }
    
        const result = await api
            .post('/api/users')
            .send(newUser)
            .expect(400)
            .expect('Content-Type', /application\/json/)
    
        expect(result.body.error).toContain('User validation failed: username: Path `username` is required.')
    
        const usersAtEnd = await helper.usersInDb()
        expect(usersAtEnd).toEqual(usersAtStart)
    })

    test('proper error is called if password is missing', async () => {
        const usersAtStart = await helper.usersInDb()
    
        const newUser = {
            username: 'jaja21',
            name: 'NOT James Franco'
        }
    
        const result = await api
            .post('/api/users')
            .send(newUser)
            .expect(400)
            .expect('Content-Type', /application\/json/)
    
        expect(result.body.error).toContain('password required')
    
        const usersAtEnd = await helper.usersInDb()
        expect(usersAtEnd).toEqual(usersAtStart)
    })

    test('proper error is called if password is too short', async () => {
        const usersAtStart = await helper.usersInDb()
    
        const newUser = {
            username: 'jaja21',
            name: 'NOT James Franco',
            password: 'pa',
        }
    
        const result = await api
            .post('/api/users')
            .send(newUser)
            .expect(400)
            .expect('Content-Type', /application\/json/)
    
        expect(result.body.error).toContain('password must be at least 3 characters long')
    
        const usersAtEnd = await helper.usersInDb()
        expect(usersAtEnd).toEqual(usersAtStart)
    })
})

afterAll(async () => {
    await mongoose.connection.close()
})