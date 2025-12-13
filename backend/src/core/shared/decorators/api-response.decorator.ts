import { applyDecorators, Type } from '@nestjs/common';
import { ApiResponse, ApiExtraModels, getSchemaPath } from '@nestjs/swagger';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ApiResponseWrapper = <TModel extends Type<any>>(
  model: TModel,
  status: number = 200,
  description?: string,
) => {
  return applyDecorators(
    ApiExtraModels(model),
    ApiResponse({
      status,
      description,
      schema: {
        allOf: [
          {
            properties: {
              success: {
                type: 'boolean',
                example: true,
              },
              data: {
                $ref: getSchemaPath(model),
              },
              timestamp: {
                type: 'string',
                example: '2024-01-01T00:00:00.000Z',
              },
            },
          },
        ],
      },
    }),
  );
};
