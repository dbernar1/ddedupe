import { useState, } from 'react';
import isEmail from 'validator/lib/isEmail';
import isEmpty from 'validator/lib/isEmpty';
import PasswordValidator from 'password-validator';

const passwordSchema = new PasswordValidator();

passwordSchema
.is().min( 8 )
.has().uppercase()
.has().lowercase()
.has().digits();

const required = value => ! isEmpty( value );

const validations = {
        isEmail,
        required,
        'valid-password': ( value ) => passwordSchema.validate( value ),
};

export const validate = ( rules ) => {
        let valid = true;

        rules.forEach( ( [ value, setError, rulesForField, ] ) => {
                let errorFoundForThisValue = '';

                for ( const [ message, check ] of Object.entries( rulesForField ) ) {
                        const isValid = 'function' === typeof check
                                ? check( value )
                                : validations[ check ]( value );
                        if (
                                ! errorFoundForThisValue
                                && ! isValid
                        ) {
                                errorFoundForThisValue = message;
                                valid = false;
                        }
                }

                setError( errorFoundForThisValue );
        } );

        return valid;
};

export const useField = ( validationRules, initialValue='' ) => {
        const [ value, setValue ] = useState( initialValue );
        const [ error, setError ] = useState( '' );

        return [
                value,
                setValue,
                error,
                [ value, setError, validationRules ],
        ];
};
