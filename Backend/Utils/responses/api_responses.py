from rest_framework import status as http_status
from rest_framework.response import Response as _Response


def success_response(message, data=None, status_code=http_status.HTTP_200_OK):
    """
    Format success responses consistently across the application

    Args:
        message (str): Success message to be displayed
        data (dict, optional): Data to be returned. Defaults to None.
        status_code (int, optional): HTTP status code. Defaults to 200.

    Returns:
        dict: Formatted success response
    """
    response = {
        'success': True,
        'message': message,
        'status_code': status_code
    }

    if data is not None:
        response['data'] = data

    return _Response(response, status=status_code)


def get_paginated_response(message, data, pagination_data):
    """
    Format paginated success responses

    Args:
        message (str): Success message to be displayed
        data (list): List of data items to be returned
        pagination_data (dict): Pagination metadata (count, next, previous)

    Returns:
        dict: Formatted paginated success response
    """
    response = success_response(
        message=message,
        data={
            'count': pagination_data.get('count'),
            'next': pagination_data.get('next'),
            'previous': pagination_data.get('previous'),
            'results': data
        }
    )
    return _Response(
        data=response.data,
        status=response.status_code
    )
