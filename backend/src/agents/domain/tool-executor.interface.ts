export interface ToolExecutionRequest {
  toolName: string;
  arguments: Record<string, any>;
  context?: any; // For passing niche context (e.g. 'dental', 'legal')
}

export interface ToolExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface ToolExecutor {
  execute(request: ToolExecutionRequest): Promise<ToolExecutionResult>;
}
