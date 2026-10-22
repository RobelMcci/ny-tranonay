import { ViteReactSSG } from 'vite-react-ssg'
import '@fontsource-variable/inter'
import '@fontsource-variable/fraunces'
import './index.css'
import { routes } from './routes.jsx'

export const createRoot = ViteReactSSG({ routes })
