def format_errors(exec):
    """
    This function takes in exception and format them
    """
    if hasattr(exec, 'detail'):
        errors = exec.detail
    elif hasattr(exec, '__str__'):
        errors = str(exec)
    else:
        errors = "An error occurred"
    
    new_errors = {}       
    if type(errors) == list:
        for index, error in enumerate(errors, 1):
            if type(error) == dict:
                for key, value in error.items():
                    new_errors[key] = str(value)
            elif type(error) == str:
                new_errors[f"non_field_{index}"] = str(error)
            elif type(error) == list:
                new_errors[f"non_field_{index}"] = str(error[0])
            else:
                new_errors[f"non_field_{index}"] = str(error)
    elif type(errors) == str:
        new_errors["non_field"] = str(errors)
    elif type(errors) == dict:
        for key, value in errors.items():
            new_errors[key] = str(value)
    return new_errors
