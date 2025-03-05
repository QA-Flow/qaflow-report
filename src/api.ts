import axios, { AxiosInstance } from 'axios';
import {
  QAFlowConfig,
  TestSession,
} from './types';


const DEFAULT_API_URL = 'https://qaflow.tech/api';

/**
 * Class for communicating with the QAFlow API
 */
export class QAFlowAPI {
  private axiosInstance: AxiosInstance;
  private config: QAFlowConfig;

  /**
   * QAFlowAPI class constructor
   * @param config Configuration required for API communication
   */
  constructor(config: QAFlowConfig) {
    this.config = config;
    this.axiosInstance = axios.create({
      baseURL: DEFAULT_API_URL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      }
    });
  }

  /**
   * Sends all test data to the API
   * @param testData Test data
   * @returns Operation success status
   */
  async submitTestReport(testData: Omit<TestSession, 'id'>): Promise<{ success: boolean; message?: string; reportId?: string }> {
    try {
      const response = await this.axiosInstance.post<{ success: boolean; message?: string; reportId?: string }>('/tests', testData);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to submit test report: ${error.message}`);
      }
      throw error;
    }
  }
} 