import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { isValidEmailFormat } from './email-format';

@ValidatorConstraint({ name: 'IsAppEmail', async: false })
export class IsAppEmailConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return typeof value === 'string' && isValidEmailFormat(value);
  }

  defaultMessage(_args: ValidationArguments): string {
    return 'Enter a valid email address';
  }
}

export function IsAppEmail(validationOptions?: ValidationOptions) {
  return function registerIsAppEmail(object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsAppEmailConstraint,
    });
  };
}
