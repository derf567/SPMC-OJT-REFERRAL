import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Bell, Settings, HelpCircle, Mail, TrendingUp, Activity, CheckCircle, Truck } from "lucide-react";

const Dashboard = () => {
  const [selectedTab, setSelectedTab] = useState("requests");

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col bg-background-light dark:bg-background-dark">
      {/* Header */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 lg:px-10 py-3 sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-4 text-primary">
            <div className="size-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-tight">
              SPMC Portal
            </h2>
          </div>
          <label className="hidden md:flex flex-col min-w-40 !h-10 max-w-64">
            <div className="flex w-full flex-1 items-stretch rounded-lg h-full">
              <div className="text-slate-400 flex border-none bg-slate-100 dark:bg-slate-800 items-center justify-center pl-4 rounded-l-lg border-r-0">
                <Search className="w-5 h-5" />
              </div>
              <input
                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-slate-900 dark:text-slate-100 focus:outline-0 focus:ring-2 focus:ring-primary border-none bg-slate-100 dark:bg-slate-800 focus:border-none h-full placeholder:text-slate-500 px-4 rounded-l-none border-l-0 pl-2 text-sm font-normal"
                placeholder="Search patients or referrals..."
              />
            </div>
          </label>
        </div>
        <div className="flex flex-1 justify-end gap-6 items-center">
          <nav className="hidden lg:flex items-center gap-6">
            <a className="text-primary text-sm font-semibold leading-normal border-b-2 border-primary pb-1" href="#">
              Dashboard
            </a>
            <a className="text-slate-600 dark:text-slate-400 text-sm font-medium leading-normal hover:text-primary" href="#">
              Referrals
            </a>
            <a className="text-slate-600 dark:text-slate-400 text-sm font-medium leading-normal hover:text-primary" href="#">
              Analytics
            </a>
            <a className="text-slate-600 dark:text-slate-400 text-sm font-medium leading-normal hover:text-primary" href="#">
              Inventory
            </a>
          </nav>
          <div className="flex gap-2">
            <button className="flex items-center justify-center rounded-lg h-10 w-10 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <button className="flex items-center justify-center rounded-lg h-10 w-10 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-800">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-none">Dr. Sarah Miller</p>
              <p className="text-xs text-slate-500 font-medium leading-none mt-1">Chief Resident</p>
            </div>
            <div className="bg-primary/20 aspect-square rounded-full size-10 flex items-center justify-center text-primary font-bold overflow-hidden border-2 border-white dark:border-slate-800 shadow-sm">
              SM
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden md:flex w-64 flex-col justify-between border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="flex flex-col gap-6">
            <div className="px-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Main Menu</p>
              <nav className="flex flex-col gap-1">
                <a className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary text-white shadow-md shadow-primary/20" href="#">
                  <span className="material-symbols-outlined text-[22px]">dashboard</span>
                  <span className="text-sm font-semibold">Overview</span>
                </a>
                <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" href="#">
                  <span className="material-symbols-outlined text-[22px]">group</span>
                  <span className="text-sm font-medium">Patient List</span>
                </a>
                <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" href="#">
                  <span className="material-symbols-outlined text-[22px]">assignment</span>
                  <span className="text-sm font-medium">Referrals</span>
                  <span className="ml-auto bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded">12</span>
                </a>
              </nav>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6">
          <div className="max-w-7xl mx-auto flex flex-col gap-6">
            {/* Welcome Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  Referral Performance Dashboard
                </h1>
                <p className="text-slate-500 text-sm font-medium">
                  Monitoring patient intake and disposition status in real-time.
                </p>
              </div>
              <div className="flex gap-3">
                <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors">
                  <span className="material-symbols-outlined text-lg">calendar_today</span>
                  <span>Last 30 Days</span>
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all">
                  <span className="material-symbols-outlined text-lg">add</span>
                  <span>New Referral</span>
                </button>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <span className="material-symbols-outlined text-primary bg-primary/10 p-2 rounded-lg">
                    description
                  </span>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    +12.5%
                  </span>
                </div>
                <p className="text-slate-500 text-sm font-medium">Pending Requests</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">12</p>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <Activity className="w-6 h-6 text-blue-500 bg-blue-500/10 p-1 rounded-lg" />
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    +5.2%
                  </span>
                </div>
                <p className="text-slate-500 text-sm font-medium">Active Cases</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">45</p>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle className="w-6 h-6 text-emerald-500 bg-emerald-500/10 p-1 rounded-lg" />
                  <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
                    Steady
                  </span>
                </div>
                <p className="text-slate-500 text-sm font-medium">Dispositioned</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">128</p>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <Truck className="w-6 h-6 text-amber-500 bg-amber-500/10 p-1 rounded-lg" />
                  <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                    -3.1%
                  </span>
                </div>
                <p className="text-slate-500 text-sm font-medium">In Transit</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">8</p>
              </div>
            </div>

            {/* Referral Overview Table */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="px-6 pt-6 pb-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Referral Overview</h2>
              </div>
              <div className="px-6 border-b border-slate-100 dark:border-slate-800">
                <div className="flex gap-8">
                  <button
                    onClick={() => setSelectedTab("requests")}
                    className={`flex flex-col items-center justify-center border-b-2 pb-3 pt-2 font-bold text-sm transition-colors ${
                      selectedTab === "requests"
                        ? "border-primary text-primary"
                        : "border-transparent text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    Requests
                  </button>
                  <button
                    onClick={() => setSelectedTab("active")}
                    className={`flex flex-col items-center justify-center border-b-2 pb-3 pt-2 font-bold text-sm transition-colors ${
                      selectedTab === "active"
                        ? "border-primary text-primary"
                        : "border-transparent text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    Active
                  </button>
                </div>
              </div>
              <div className="p-0 overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                      <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase">Patient Name</th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase">Specialty</th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase">Urgency</th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                            JD
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Jane Doe</p>
                            <p className="text-[11px] text-slate-400 font-medium">ID: #SPMC-4029</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                        Cardiology
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-700">
                          Urgent
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-600">
                          <span className="size-2 rounded-full bg-amber-600 animate-pulse"></span>
                          Awaiting Verification
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
