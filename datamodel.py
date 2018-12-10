class NestData(object):
    def __init__(self, data):
        self.data = data
        self.results = self.data and self.data.get("results")
        self.structures = self.results and self.results.get('structures')
        self.devices = self.results and self.results.get("devices")

    def has_structures(self):
        return self.structures is not None and len(self.structures) > 0

    def get_structures(self):
        return self.structures

    def get_devices(self):
        return self.devices
 
    def get_smoke_co_alarms(self):
        return self.devices and self.devices.get("smoke_co_alarms")

    def get_thermostats(self):
        return self.devices and self.devices.get("thermostats")

    def get_cameras(self):
        return self.devices and self.devices.get("cameras")

    def get_metadata(self):
        return self.results and self.results.get('metadata')

    def get_data(self):
        return self.data

    def get_locale(self, structure_id=None):
        locales = {}
        thermostats = self.get_thermostats()
        if thermostats:
            for thermostat in thermostats.values():
                locale = thermostat.get("locale")
                if locale:
                    locales[thermostat["structure_id"]] = str(locale)

        if structure_id and structure_id in locales:
            return locales[structure_id]

        # just return first locale found
        return locales.values()[0] if len(locales) > 0 else None

    def get_device_types(self, defaults=[]):
        device_types = (self.devices or {}).keys()
        ext_device_types = device_types + [d for d in defaults if d not in device_types]
        return ext_device_types

    @classmethod
    def camera_has_subscription(cls, camera):
        return camera and camera.get("is_video_history_enabled")

    @classmethod
    def get_camera_img_field_list(cls):
        # Camera fields used for getting current images (ast_event is a key to another object).
        # The URL values may change with each request from the Nest API.
        return ['app_url', 'snapshot_url', 'web_url', 'last_event', 'pull_event_stream_urls']

