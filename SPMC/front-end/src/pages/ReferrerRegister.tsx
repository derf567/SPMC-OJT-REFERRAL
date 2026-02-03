import React, {useEffect, useState} from 'react'
import { Button } from '@/components/ui/button'

const ReferrerRegister: React.FC = () => {
	const [specialties, setSpecialties] = useState<any[]>([])
	const [hospitals, setHospitals] = useState<any[]>([])
	const [regions, setRegions] = useState<any[]>([])
	const [provinces, setProvinces] = useState<any[]>([])
	const [cities, setCities] = useState<any[]>([])
	const [barangays, setBarangays] = useState<any[]>([])
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
		hospital_name: '',
		age: '',
		region: '',
		province: '',
		city: '',
		barangay: '',
		exact_address: '',
		gender: '',
		position: '',
		agreeToPrivacy: false
	})
	const [files, setFiles] = useState<FileList | null>(null)
	const [message, setMessage] = useState<string | null>(null)

	useEffect(()=>{
		fetch('/api/specialties/').then(r=>{ if(r.ok) return r.json(); return []}).then(d=>setSpecialties(Array.isArray(d) ? d : []))
		fetch('/api/hospitals/').then(r=>{ if(r.ok) return r.json(); return []}).then(d=>setHospitals(Array.isArray(d) ? d : []))
		// try to fetch regions list; endpoints may be absent in backend
		fetch('/api/regions/').then(r=>{ if(r.ok) return r.json(); return []}).then(d=>setRegions(Array.isArray(d) ? d : []))
	},[])

	useEffect(()=>{
		// when region changes, load provinces
		if(form.region){
			fetch(`/api/provinces/?region_id=${form.region}`).then(r=>{ if(r.ok) return r.json(); return []}).then(d=>setProvinces(d || []))
			setCities([])
			setBarangays([])
		} else {
			setProvinces([])
			setCities([])
			setBarangays([])
		}
	},[form.region])

	useEffect(()=>{
		if(form.province){
			fetch(`/api/cities/?province_id=${form.province}`).then(r=>{ if(r.ok) return r.json(); return []}).then(d=>setCities(d || []))
			setBarangays([])
		} else {
			setCities([])
			setBarangays([])
		}
	},[form.province])

	useEffect(()=>{
		if(form.city){
			fetch(`/api/barangays/?city_id=${form.city}`).then(r=>{ if(r.ok) return r.json(); return []}).then(d=>setBarangays(d || []))
		} else {
			setBarangays([])
		}
	},[form.city])

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
		const {name, value, type, checked} = e.target as any
		if(type === 'select-multiple') return
		setForm((s:any)=>({...s, [name]: type === 'checkbox' ? checked : value}))
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
		if (!form.agreeToPrivacy) {
			setMessage('You must agree to the Data Privacy Act to proceed.')
			return
		}
		const fd = new FormData()
		// For hospital account we may submit a single affiliate_hospitals entry named 'affiliate_hospitals'
		fd.append('username', form.username)
		fd.append('email', form.email)
		fd.append('password', form.password)
		fd.append('age', String(form.age))
		fd.append('gender', form.gender)
		// address fields: send region/province/city/barangay and exact address
		fd.append('region', form.region || '')
		fd.append('province', form.province || '')
		fd.append('city', form.city || '')
		fd.append('barangay', form.barangay || '')
		fd.append('address', form.exact_address || '')
		fd.append('first_name', form.first_name)
		fd.append('middle_name', form.middle_name)
		fd.append('last_name', form.last_name)
		fd.append('referrer_type', form.referrer_type)
		if(form.position) fd.append('position', form.position)
		form.specialties?.forEach((id:number)=> fd.append('specialties', String(id)))
		// If hospital account, send the hospital name
		if(form.hospital_name){
			fd.append('hospital_name', form.hospital_name)
		} else {
			form.affiliate_hospitals?.forEach((id:number)=> fd.append('affiliate_hospitals', String(id)))
		}
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
							{/* Put referrer type at the top */}
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

							{/* If hospital account, show only hospital-specific fields */}
							{form.referrer_type === 'hospital_account' ? (
								<>
									<div>
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Hospital Name / Username</label>
										<textarea name="hospital_name" placeholder="Enter hospital name" onChange={handleChange} value={form.hospital_name} required
											className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Hospital Email</label>
										<input name="email" placeholder="Hospital email" onChange={handleChange} value={form.email} required
											className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300" />
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password</label>
										<input name="password" placeholder="Password" type="password" onChange={handleChange} value={form.password} required
											className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300" />
									</div>

									{/* Hospital Address Separator */}
									<div className="text-lg font-semibold mt-4 mb-2 text-gray-900 dark:text-white">Hospital Address</div>

									{/* Address dropdowns for hospital */}
									<div>   
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Region</label>
										<select name="region" value={form.region} onChange={handleChange} required
											className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
											<option value="">Select Region</option>
											{regions.map((r:any)=>(<option key={r.id||r.code} value={r.id||r.code}>{r.name}</option>))}
										</select>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Province</label>
										<select name="province" value={form.province} onChange={handleChange} required
											className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
											<option value="">Select Province</option>
											{provinces.map((p:any)=>(<option key={p.id||p.code} value={p.id||p.code}>{p.name}</option>))}
										</select>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">City / Municipality</label>
										<select name="city" value={form.city} onChange={handleChange} required
											className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
											<option value="">Select City / Municipality</option>
											{cities.map((c:any)=>(<option key={c.id||c.code} value={c.id||c.code}>{c.name}</option>))}
										</select>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Barangay</label>
										<select name="barangay" value={form.barangay} onChange={handleChange} required
											className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
											<option value="">Select Barangay</option>
											{barangays.map((b:any)=>(<option key={b.id||b.code} value={b.id||b.code}>{b.name}</option>))}
										</select>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Exact Address</label>
										<textarea name="exact_address" placeholder="House/Street, Building, etc." onChange={handleChange} value={form.exact_address} required
											className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Upload Legal Documents</label>
										<input type="file" multiple onChange={handleFiles} required
											className="w-full text-sm text-gray-700 dark:text-gray-300" />
										<p className="text-xs text-gray-500 mt-1">Please upload any legal documents proving hospital validity.</p>
									</div>
								</>
							) : (
								<>
									{/* Non-hospital account form (doctors, hospital employees, others) */}
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


							{form.referrer_type === 'doctor' && (
							<>
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
							</>
							)}

							{(form.referrer_type === 'doctor' || form.referrer_type === 'hospital_employee') && (
								<>
									<div>
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Age</label>
										<input name="age" type="number" placeholder="Age" onChange={handleChange} value={form.age}
											className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Gender</label>
										<select name="gender" value={form.gender} onChange={handleChange}
											className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
											<option value="">Select gender</option>
											<option value="male">Male</option>
											<option value="female">Female</option>
											<option value="other">Other</option>
										</select>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Region</label>
										<select name="region" value={form.region} onChange={handleChange}
											className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
											<option value="">Select Region</option>
											{regions.map((r:any)=>(<option key={r.id||r.code} value={r.id||r.code}>{r.name}</option>))}
										</select>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Province</label>
										<select name="province" value={form.province} onChange={handleChange}
											className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
											<option value="">Select Province</option>
											{provinces.map((p:any)=>(<option key={p.id||p.code} value={p.id||p.code}>{p.name}</option>))}
										</select>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">City / Municipality</label>
										<select name="city" value={form.city} onChange={handleChange}
											className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
											<option value="">Select City / Municipality</option>
											{cities.map((c:any)=>(<option key={c.id||c.code} value={c.id||c.code}>{c.name}</option>))}
										</select>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Barangay</label>
										<select name="barangay" value={form.barangay} onChange={handleChange}
											className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
											<option value="">Select Barangay</option>
											{barangays.map((b:any)=>(<option key={b.id||b.code} value={b.id||b.code}>{b.name}</option>))}
										</select>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Exact Address</label>
										<textarea name="exact_address" placeholder="House/Street, Building, etc." onChange={handleChange} value={form.exact_address}
											className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
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
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Upload Official ID</label>
								<input type="file" multiple onChange={handleFiles} required
									className="w-full text-sm text-gray-700 dark:text-gray-300" />
								<p className="text-xs text-gray-500 mt-1">Upload your official registered or Legal ID for verification.</p>
							</div>
						</>
						)}
						</div>

						<div className="flex items-start">
							<input type="checkbox" name="agreeToPrivacy" checked={form.agreeToPrivacy} onChange={handleChange} required
								className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
							<label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
								Data Privacy Acknowledgment
I acknowledge that all data obtained during the verification process are protected under Republic Act No. 10173, also known as the Data Privacy Act of 2012. I understand that such data shall be handled with utmost confidentiality and shall be collected, processed, stored, and used strictly in accordance with the provisions of the Act and its implementing rules and regulations.
							</label>
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
