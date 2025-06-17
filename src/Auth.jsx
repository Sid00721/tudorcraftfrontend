import { useState } from 'react'
import { supabase } from './supabaseClient'

export default function Auth() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async (event) => {
    event.preventDefault()

    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      alert(error.error_description || error.message)
    }
    setLoading(false)
  }
  
  // Optional: A sign-up function for creating the first admin user
  const handleSignUp = async (event) => {
    event.preventDefault()
    
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({ email, password })
    
    if (error) {
      alert(error.error_description || error.message)
    } else {
      alert('Sign up successful! Please check your email to verify your account.')
    }
    setLoading(false)
  }

  return (
    <div className="row flex-center">
      <div className="col-6 form-widget">
        <h1 className="header">Tutor Matching Admin</h1>
        <p className="description">Sign in to your account</p>
        <form className="form-widget" onSubmit={handleLogin}>
          <div>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              className="inputField"
              type="email"
              placeholder="Your email"
              value={email}
              required={true}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              className="inputField"
              type="password"
              placeholder="Your password"
              value={password}
              required={true}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <button className={'button block'} disabled={loading}>
              {loading ? <span>Loading</span> : <span>Login</span>}
            </button>
            {/* You can uncomment the button below to sign up your first user */}
            <button className={'button block'} onClick={handleSignUp} disabled={loading}>
              {loading ? <span>Loading</span> : <span>Sign Up</span>}
            </button>       
          </div>
        </form>
      </div>
    </div>
  )
}