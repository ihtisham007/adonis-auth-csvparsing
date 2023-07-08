// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { HttpContext } from "@adonisjs/core/build/standalone";
import Todo from "App/Models/Todo";

export default class TodosController {
  public async index({request}) {
    const page = request.input('page', 1)
    const limit = request.input('per_page', 2)
    return Todo.query().paginate(page, limit)
  }

  public async store({ request, response }) {
    Todo.create({ title: request.input('title'), is_completed: false })
    return response.status(201).json('Created')
  }

  public async update({ request, response, params }) {
    const todo = await Todo.findOrFail(params.id)
    todo.is_completed = request.input('is_completed')
    todo.save()
    return response.status(200).json(todo)
  }
}
