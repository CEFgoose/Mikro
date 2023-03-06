import sqlalchemy as sa


class IntegerIntFlag(sa.types.TypeDecorator):
    impl = sa.Integer

    def __init__(self, intflagtype, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._intflagtype = intflagtype

    def process_bind_param(self, value, dialect):
        return value.value

    def process_result_value(self, value, dialect):
        return self._intflagtype(value)
