import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private API = 'http://localhost:3000/v1/auth'; // API Gateway

  constructor(private http: HttpClient) {}

  login(payload: any) {
    return this.http.post(`${this.API}/login`, payload, {
      withCredentials: true,
    });
  }

  signup(payload: any) {
    return this.http.post(`${this.API}/register`, payload, {
      withCredentials: true,
    });
  }

  refresh() {
    return this.http.get(`${this.API}/refresh`, {
      withCredentials: true,
    });
  }

  logout() {
    return this.http.post(
      `${this.API}/logout`,
      {},
      {
        withCredentials: true,
      }
    );
  }
}
