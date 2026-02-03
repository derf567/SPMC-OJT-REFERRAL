import React, {useEffect, useState} from 'react'
import { Button } from '@/components/ui/button'

const ReferrerRegister: React.FC = () => {
	const [specialties, setSpecialties] = useState<any[]>([])
	const [hospitals, setHospitals] = useState<any[]>([])
	const [form, setForm] = useState<any>({
		username: '',
		email: '',
		password: '',
		first_name: '',
		middle_name: '',
		last_name: '',
		referrer_type: 'doctor',
		specialties: [] as number[],
		affiliate_hospitals: [] as number[],
		position: ''
	})
	const [files, setFiles] = useState<FileList | null>(null)
	const [message, setMessage] = useState<string | null>(null)

	useEffect(()=>{
		fetch('/api/specialties/').then(r=>r.json()).then(d=>setSpecialties(d))
		fetch('/api/hospitals/').then(r=>r.json()).then(d=>setHospitals(d))
	},[])

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const {name, value, type} = e.target
		if(type === 'select-multiple') return
		setForm((s:any)=>({...s, [name]: value}))
	}

	const handleMultiSelect = (e: React.ChangeEvent<HTMLSelectElement>, key: string) => {
		const options = Array.from(e.target.selectedOptions).map(o=>Number(o.value))
		setForm((s:any)=>({...s, [key]: options}))
	}

	const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFiles(e.target.files)
	}

	const submit = async (e: React.FormEvent) => {
		e.preventDefault()
		const fd = new FormData()
		fd.append('username', form.username)
		fd.append('email', form.email)
		fd.append('password', form.password)
		fd.append('first_name', form.first_name)
		fd.append('middle_name', form.middle_name)
		fd.append('last_name', form.last_name)
		fd.append('referrer_type', form.referrer_type)
		if(form.position) fd.append('position', form.position)
		form.specialties?.forEach((id:number)=> fd.append('specialties', String(id)))
		form.affiliate_hospitals?.forEach((id:number)=> fd.append('affiliate_hospitals', String(id)))
		if(files){
			Array.from(files).forEach(f=> fd.append('documents', f))
		}

		try{
			const res = await fetch('/api/referrers/', {method: 'POST', body: fd})
			if(res.ok){
				const data = await res.json()
				setMessage('Registration successful')
				console.log('created', data)
			} else {
				const err = await res.json()
				setMessage('Error: ' + JSON.stringify(err))
			}
		}catch(err:any){
			setMessage('Network error')
		}
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
			<div className="max-w-xl w-full space-y-8">
				<div className="text-center">
					<div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
						<span className="text-white font-bold text-2xl">S</span>
					</div>
					<h2 className="text-3xl font-bold text-gray-900 dark:text-white">Referrer Registration</h2>
					<p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Create an account to submit referrals. Doctors must upload an official registered ID. Hospital accounts must upload legal documents.</p>
				</div>

				<div className="bg-white dark:bg-gray-800 py-8 px-6 shadow-xl rounded-lg border border-gray-200 dark:border-gray-700">
					{message && (
						<div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-3 text-sm">
							{message}
						</div>
					)}

					<form className="space-y-6" onSubmit={submit}>
						<div className="grid grid-cols-1 gap-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Username</label>
								<input name="username" placeholder="Username" onChange={handleChange} value={form.username} required
									className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300" />
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email (optional)</label>
								<input name="email" placeholder="Email" onChange={handleChange} value={form.email}
									className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300" />
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password</label>
								<input name="password" placeholder="Password" type="password" onChange={handleChange} value={form.password} required
									className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300" />
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">First Name</label>
								<input name="first_name" placeholder="First name" onChange={handleChange} value={form.first_name} required
									className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300" />
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Middle Name</label>
								<input name="middle_name" placeholder="Middle name" onChange={handleChange} value={form.middle_name}
									className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300" />
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Last Name</label>
								<input name="last_name" placeholder="Last name" onChange={handleChange} value={form.last_name} required
									className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300" />
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Referrer Type</label>
								<select name="referrer_type" value={form.referrer_type} onChange={handleChange}
									className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
									<option value="doctor">Doctor / Medical Professional</option>
									<option value="hospital_employee">Authorized Hospital Employee</option>
									<option value="hospital_account">Hospital Account</option>
									<option value="other">Other</option>
								</select>
							</div>

							{form.referrer_type === 'doctor' && (
								<>
									<div>
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Specialties</label>
										<select multiple onChange={(e)=>handleMultiSelect(e,'specialties')}
											className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
											{specialties.map(s=>(<option key={s.id} value={s.id}>{s.name}</option>))}
										</select>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Affiliate Hospitals</label>
										<select multiple onChange={(e)=>handleMultiSelect(e,'affiliate_hospitals')}
											className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
											{hospitals.map(h=>(<option key={h.id} value={h.id}>{h.name}</option>))}
										</select>
									</div>
								</>
							)}

							{form.referrer_type === 'hospital_employee' && (
								<div>
									<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Position / Role</label>
									<input name="position" placeholder="Position / Role" onChange={handleChange} value={form.position}
										className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300" />
								</div>
							)}

							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Upload Official ID / Legal Documents</label>
								<input type="file" multiple onChange={handleFiles}
									className="w-full text-sm text-gray-700 dark:text-gray-300" />
								<p className="text-xs text-gray-500 mt-1">For doctors: upload official registered ID. For hospital accounts: upload legal documents proving hospital affiliation.</p>
							</div>
						</div>

						<div>
							<Button type="submit" className="w-full" >Register</Button>
						</div>
					</form>
				</div>

				<div className="text-center">
					<p className="text-xs text-gray-500 dark:text-gray-400">© 2026 Southern Philippines Medical Center. All rights reserved.</p>
				</div>
			</div>
		</div>
	)
}

export default ReferrerRegister
