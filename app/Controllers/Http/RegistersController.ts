// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { HttpContext } from '@adonisjs/core/build/standalone'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import User from 'App/Models/User'

export default class RegistersController {
  public async register({ request, response }) {
    const validations = await schema.create({
      email: schema.string({}, [rules.email(), rules.unique({ table: 'users', column: 'email' })]),
      password: schema.string({}, [rules.confirmed()]),
    })

    const data =  await request.validate({ schema: validations })

    const user = await User.create(data)
    return response.created(user)
  }

  public async login({ request, response, auth }) {
    const email = request.input('email')
    const password = request.input('password')
    const token = await auth.attempt(email, password)
    return response.status(200).json({ token: token.toJSON() })
  }
}
