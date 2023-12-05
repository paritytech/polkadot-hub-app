import axios from 'axios'
import { Integration } from '../integration'
import {
  Employee,
  EmployeeWithExtraFields,
  EmployeeTimeOffRequest,
} from './types'

class BambooHR extends Integration {
  id = 'bamboohr'
  private credentials = {
    apiToken: process.env.BAMBOOHR_API_TOKEN || '',
    subdomain: process.env.BAMBOOHR_SUBDOMAIN || '',
  }
  private baseUrl = `https://api.bamboohr.com/api/gateway.php/${this.credentials.subdomain}`
  private headers = { Accept: 'application/json' }

  private auth = {
    username: this.credentials.apiToken,
    password: 'x',
  }

  async findEmployee(email: string): Promise<Employee | null> {
    const employees = await this.getEmployees()
    const employee = employees.find((x) => x.workEmail === email)
    if (!employee) {
      console.warn(`User '${email}' was not found in the BambooHR database`)
      return null
    }
    return employee
  }

  async getEmployees(): Promise<Employee[]> {
    // https://documentation.bamboohr.com/reference#get-employees-directory-1
    return axios
      .get(`${this.baseUrl}/v1/employees/directory`, {
        headers: this.headers,
        auth: this.auth,
      })
      .then((res) => res.data?.employees)
  }

  async getEmployeeExtraFields(
    employeeId: string,
    extraFields: string[]
  ): Promise<EmployeeWithExtraFields> {
    // https://documentation.bamboohr.com/reference#get-employee
    return axios
      .get(
        `${this.baseUrl}/v1/employees/${employeeId}/?fields=${extraFields.join(
          ','
        )}`,
        {
          headers: this.headers,
          auth: this.auth,
        }
      )
      .then((res) => res.data)
  }

  async getTimeOffRequests(props: {
    startDate: string
    endDate: string
  }): Promise<EmployeeTimeOffRequest[]> {
    // https://documentation.bamboohr.com/reference/time-off-get-time-off-requests-1
    return axios
      .get<EmployeeTimeOffRequest[]>(`${this.baseUrl}/v1/time_off/requests`, {
        headers: this.headers,
        auth: this.auth,
        params: {
          action: 'view',
          start: props.startDate,
          end: props.endDate,
        },
      })
      .then((res) => res.data)
  }
}

export default BambooHR
