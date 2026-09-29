from rest_framework import serializers
from ..models import GovernmentService


class GovernmentServiceSerializer(serializers.ModelSerializer):
    """
    Serializer for the GovernmentService model
    """
    class Meta:
        model = GovernmentService
        fields = ('id', 'service_code', 'service_name', 'description',
                  'contact_email', 'is_active', 'allowed_batch_size',
                  'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')


class GovernmentServiceCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating a new GovernmentService with API key
    """
    api_key = serializers.CharField(read_only=True)

    class Meta:
        model = GovernmentService
        fields = ('id', 'service_code', 'service_name', 'description',
                  'contact_email', 'is_active', 'allowed_batch_size',
                  'api_key', 'created_at', 'updated_at')
        read_only_fields = ('id', 'api_key', 'created_at', 'updated_at')

    def create(self, validated_data):
        """
        Create and return a new GovernmentService instance with API key
        """
        service = GovernmentService.objects.create(**validated_data)
        # Retrieve the raw API key that was temporarily stored during save()
        api_key = getattr(service, '_raw_api_key', None)

        # Add the API key to the serialized data for the response
        if api_key:
            self._api_key = api_key

        return service

    def to_representation(self, instance):
        """
        Add the API key to the serialized representation if available
        """
        representation = super().to_representation(instance)
        api_key = getattr(self, '_api_key', None)

        if api_key:
            representation['api_key'] = api_key

        return representation
