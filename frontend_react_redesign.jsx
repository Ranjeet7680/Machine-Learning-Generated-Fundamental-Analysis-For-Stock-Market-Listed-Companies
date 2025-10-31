// Project: ML Fundamental Analysis - React Frontend (Redux + Tailwind + Recharts)
// File layout (single-file preview). When copying into your project, create these files accordingly.

/* package.json */
{
  "name": "ml-fundamental-frontend",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "react-router-dom": "^6.14.1",
    "@reduxjs/toolkit": "^1.9.5",
    "react-redux": "^8.1.1",
    "axios": "^1.4.0",
    "recharts": "^2.6.2",
    "tailwindcss": "^3.6.0",
    "clsx": "^2.0.0",
    "dayjs": "^1.11.9"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  }
}

/* Tailwind: Add to tailwind.config.js */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
}

/* src/index.js */
import React from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import store from './store'
import './index.css'

const container = document.getElementById('root')
const root = createRoot(container)
root.render(
  <Provider store={store}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Provider>
)

/* src/store/index.js */
import { configureStore } from '@reduxjs/toolkit'
import companiesReducer from './slices/companiesSlice'
import uiReducer from './slices/uiSlice'

const store = configureStore({
  reducer: {
    companies: companiesReducer,
    ui: uiReducer,
  },
})

export default store

/* src/store/slices/companiesSlice.js */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../utils/api'

// Async thunk to fetch list of companies
export const fetchCompanies = createAsyncThunk('companies/fetchCompanies', async () => {
  const res = await api.get('/companies')
  return res.data
})

export const fetchCompanyFinancials = createAsyncThunk(
  'companies/fetchCompanyFinancials',
  async (symbol) => {
    const res = await api.get(`/financials/${symbol}`)
    return { symbol, data: res.data }
  }
)

const companiesSlice = createSlice({
  name: 'companies',
  initialState: { list: [], financials: {}, status: 'idle', error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCompanies.pending, (state) => { state.status = 'loading' })
      .addCase(fetchCompanies.fulfilled, (state, action) => { state.status = 'succeeded'; state.list = action.payload })
      .addCase(fetchCompanies.rejected, (state, action) => { state.status = 'failed'; state.error = action.error.message })
      .addCase(fetchCompanyFinancials.fulfilled, (state, action) => {
        state.financials[action.payload.symbol] = action.payload.data
      })
  }
})

export default companiesSlice.reducer

/* src/store/slices/uiSlice.js */
import { createSlice } from '@reduxjs/toolkit'

const uiSlice = createSlice({
  name: 'ui',
  initialState: { sidebarOpen: true, theme: 'light' },
  reducers: {
    toggleSidebar(state) { state.sidebarOpen = !state.sidebarOpen },
    setTheme(state, action) { state.theme = action.payload }
  }
})

export const { toggleSidebar, setTheme } = uiSlice.actions
export default uiSlice.reducer

/* src/utils/api.js */
import axios from 'axios'

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE || 'http://localhost:8000/api',
  timeout: 30000,
})

export default api

/* src/App.js */
import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './views/Dashboard'
import CompanyPage from './views/CompanyPage'
import Layout from './components/Layout'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/company/:symbol" element={<CompanyPage />} />
      </Routes>
    </Layout>
  )
}

export default App

/* src/components/Layout.js */
import React from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function Layout({ children }) {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="p-6 overflow-auto">{children}</main>
      </div>
    </div>
  )
}

/* src/components/Sidebar.js */
import React from 'react'
import { Link } from 'react-router-dom'

export default function Sidebar(){
  return (
    <aside className="w-64 bg-white border-r">
      <div className="p-4 text-xl font-bold">MLFund</div>
      <nav className="p-4">
        <Link to="/dashboard" className="block py-2">Dashboard</Link>
        <Link to="/" className="block py-2">Companies</Link>
      </nav>
    </aside>
  )
}

/* src/components/Topbar.js */
import React from 'react'
import { useDispatch } from 'react-redux'
import { toggleSidebar } from '../store/slices/uiSlice'

export default function Topbar(){
  const dispatch = useDispatch()
  return (
    <header className="flex items-center justify-between p-4 bg-white border-b">
      <div className="flex items-center space-x-4">
        <button onClick={() => dispatch(toggleSidebar())} className="p-2">☰</button>
        <h1 className="text-lg font-semibold">ML Fundamental Analysis</h1>
      </div>
      <div className="flex items-center space-x-4">
        <input placeholder="Search company" className="px-3 py-2 border rounded" />
      </div>
    </header>
  )
}

/* src/views/Dashboard.js */
import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchCompanies } from '../store/slices/companiesSlice'
import CompanyList from '../widgets/CompanyList'
import TopMovers from '../widgets/TopMovers'

export default function Dashboard(){
  const dispatch = useDispatch()
  const companies = useSelector(state => state.companies.list)

  useEffect(() => { dispatch(fetchCompanies()) }, [dispatch])

  return (
    <div className="grid grid-cols-3 gap-6">
      <section className="col-span-2">
        <h2 className="text-xl font-semibold mb-4">Companies</h2>
        <CompanyList companies={companies} />
      </section>
      <aside className="col-span-1">
        <TopMovers />
      </aside>
    </div>
  )
}

/* src/widgets/CompanyList.js */
import React from 'react'
import { Link } from 'react-router-dom'

export default function CompanyList({ companies }){
  return (
    <div className="bg-white p-4 rounded shadow">
      {companies.length === 0 ? (
        <div>Loading companies...</div>
      ) : (
        <ul>
          {companies.map(c => (
            <li key={c.symbol} className="py-2 border-b">
              <Link to={`/company/${c.symbol}`} className="flex justify-between">
                <span className="font-medium">{c.company_name}</span>
                <span className="text-sm text-gray-600">{c.symbol}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* src/widgets/TopMovers.js */
import React from 'react'

export default function TopMovers(){
  // Placeholder: integrate with API for real movers
  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="font-semibold mb-2">Top Movers</h3>
      <div className="text-sm text-gray-600">No data yet</div>
    </div>
  )
}

/* src/views/CompanyPage.js */
import React, { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchCompanyFinancials } from '../store/slices/companiesSlice'
import FinancialCharts from '../widgets/FinancialCharts'

export default function CompanyPage(){
  const { symbol } = useParams()
  const dispatch = useDispatch()
  const financials = useSelector(state => state.companies.financials[symbol])

  useEffect(() => { if(symbol) dispatch(fetchCompanyFinancials(symbol)) }, [dispatch, symbol])

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-xl font-semibold">{symbol}</h2>
        <p className="text-sm text-gray-600">Company details and quick metrics</p>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-4">Financials</h3>
        {financials ? <FinancialCharts data={financials} /> : <div>Loading financials...</div>}
      </div>
    </div>
  )
}

/* src/widgets/FinancialCharts.js */
import React from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function FinancialCharts({ data }){
  // Assume data.keyed by statement: { balance_sheet: {...}, income_statement: {...}, cash_flow: {...} }
  // Transform sample: plot Revenue over years
  const revenueSeries = (data && data.income_statement && data.income_statement.revenue_series) || []

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <LineChart data={revenueSeries}>
          <XAxis dataKey="year" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#8884d8" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

html, body, #root { height: 100%; }

/* README for Frontend Integration (brief) */
/*
1. Create-react-app or Vite scaffold
2. Install dependencies from package.json
3. Add Tailwind config + postcss if using CRA
4. Set REACT_APP_API_BASE to your backend API
5. Run: npm start
*/

// End of single-file preview. Split into real files before running.
