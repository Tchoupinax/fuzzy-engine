<template>
  <div
    class="flex flex-col items-center justify-center flex-1 h-full mt-16 mb-32 text-theme-default"
  >
    <div>
      <h1 class="text-center title">
        fuzzy-engine
      </h1>
      <h2 class="text-center subtitle">
        Docker registry UI made with love
      </h2>

      <div class="flex items-center justify-center mt-16 mb-16 mr-8">
        <div
          v-for="({ name, image }) of providers"
          :key="name"
          class="flex items-center justify-center w-32 p-4 ml-8 border-4 cursor-pointer"
          :class="{
            'border-theme-lighter': provider === name,
            'hover:border-indigo-400 border-transparent': provider !== name
          }"
          @click="changeProvider(name)"
        >
          <img
            class="w-auto h-24"
            :src="image"
          >
        </div>
      </div>

      <div class="flex justify-center w-full mt-16">
        <button
          class="px-4 py-2 font-bold text-white rounded bg-theme-lighter"
          :class="{
            'hover:bg-theme-default': connected,
            'bg-theme-lighter cursor-not-allowed': !connected,
          }"
          :disabled="!connected"
          @click="openList"
        >
          Show Docker images
        </button>
      </div>

      <div class="flex justify-center mt-8">
        <form class="w-full" @submit="openList">
          <div
            v-if="provider === 'docker-registry-v2'"
            class="flex flex-col items-center justify-center w-full p-4"
          >
            <input
              v-model="urlData"
              :disabled="urlEnv"
              type="text"
              class="w-full p-1 px-2 mb-4 text-xl font-bold border rounded text-theme-default border-theme-default placeholder-theme-lighter"
              placeholder="registry.mydomain.com"
              @keyup="saveData"
            >

            <input
              v-model="usernameData"
              :disabled="usernameEnv"
              type="text"
              class="w-full p-1 px-2 mb-4 text-xl font-bold border rounded text-theme-default border-theme-default placeholder-theme-lighter"
              placeholder="username"
              @keyup="saveData"
            >

            <div class="flex justify-center w-full">
              <input
                v-model="passwordData"
                class="w-full p-1 px-2 text-xl font-bold border rounded-l text-theme-default border-theme-default docker-pull placeholder-theme-lighter"
                :type="revealed ? 'text' : 'password'"
                placeholder="password"
                @keyup="saveData"
              >
              <button
                class="p-2 px-4 text-white border border-l-0 rounded-r border-theme-default bg-theme-default"
                type="button"
                @click="revealed = !revealed"
              >
                <div class="w-4">
                  <svg
                    v-if="!revealed"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                    />
                  </svg>
                  <svg
                    v-else
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
              </button>
            </div>
          </div>

          <div
            v-if="provider === 'aws-ecr'"
            class="flex flex-col items-center justify-center w-full p-4"
          >
            <input
              v-model="awsEcr.region"
              :disabled="urlEnv"
              type="text"
              class="w-full p-1 px-2 mb-4 text-xl font-bold border rounded text-theme-default border-theme-default placeholder-theme-lighter"
              placeholder="region"
              @keyup="saveData"
            >

            <input
              v-model="awsEcr.accessKey"
              :disabled="usernameEnv"
              type="text"
              class="w-full p-1 px-2 mb-4 text-xl font-bold border rounded text-theme-default border-theme-default placeholder-theme-lighter"
              placeholder="access-key"
              @keyup="saveData"
            >

            <div class="flex justify-center w-full">
              <input
                v-model="awsEcr.secretKey"
                class="w-full p-1 px-2 text-xl font-bold border rounded-l text-theme-default border-theme-default docker-pull placeholder-theme-lighter"
                :type="revealed ? 'text' : 'password'"
                placeholder="secret-key"
                @keyup="saveData"
              >
              <button
                class="p-2 px-4 text-white border border-l-0 rounded-r border-theme-default bg-theme-default"
                type="button"
                @click="revealed = !revealed"
              >
                <div class="w-4">
                  <svg
                    v-if="!revealed"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                    />
                  </svg>
                  <svg
                    v-else
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
              </button>
            </div>
          </div>

          <button class="invisible" type="submit" />
        </form>
      </div>
    </div>
  </div>
</template>

<script>
const { setCookie } = require('@/functions/cookies');

export default {
  name: 'IndexPage',
  asyncData ({ store }) {
    return {
      awsEcr: store.state.awsEcr ?? {},
      provider: store.state.provider ?? 'docker-registry-v2',
    };
  },
  data () {
    return {
      providers: [
        {
          name: 'docker-registry-v2',
          image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxITEBMSEhAVFhUXFhcYFhgWFxcSHhccFhgWFhcVGBcYHSggGBolHhYWITEhJSkrLi4uGR8zODMtNygtLisBCgoKDg0OGxAQGi8lHyUtLS0vLS0tLS0tLS0tLS0tLS0tLS8vLS0vLS0uKy0tLS0tLS0tLS0tLy0tLS0tLS0tLf/AABEIAOEA4QMBIgACEQEDEQH/xAAcAAEAAgMBAQEAAAAAAAAAAAAABgcDBAUCAQj/xABNEAABAwICBgQJCAYIBgMAAAABAAIDBBEFIQYHEjFBURMiYXEUMkJSYnKBkbEzQ3OSobPBwiM0NVPD0RZEdIOy0uHwFSSCk6LEFyVU/8QAGgEBAAMBAQEAAAAAAAAAAAAAAAEEBQMCBv/EADMRAAIBAgQDBQcEAwEAAAAAAAABAgMRBCExURJB0QUyUmFxE4GRobHB4RQVIvBikqJC/9oADAMBAAIRAxEAPwC8UREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAFVWsDEqhuIdHHVSRMbB0hDM9175K1VUWsT9qP/sp/FdaKUqiTK2LlKNGTi7M5X/Eaq9v+I1P1R572edzYVlw/F6rwmm/52Z7XTNY4O6uRax/M3yeFzx43u+9nXvD/wBYpP7Uz7qBXalKmoNqP1+7MnD4ivKtGMptpt8o+e0Uy+kRFmm+EREAREQBERAEREAREQBERAEREAREQBERAEREAVJ/01xMl5FWwAOcOtEzgfVV2L85M8Sb15vgu9CClJp7FPG1JU4Jxdnckf8AS/E//wBsW/Z+TZv3fu+xINL8Uc63hkY8SxMTM+k8W3UXD8r+9/iPX2h3t7qT4lXHQp3WX9sZKxtfhb4uS5LdL7kg/pVie/w6L/tM4AHzORC4mJVtTJUiSaWGR5ieNpzbN2GnZcCGgZpH4g9R33cKxVfyn93UfeFSqUFmlbTcl4mrNOMpXTT5Lb8HsTy3/qn1X+c/t87bWTDpXmqpNoQ28IZbog4dazN+16OytUeM32feSrPg/wCsUv8AaWfdRKarvTZzwuVeOmr5LY/QKIiyj6UIiIAq9xzWH0NYY44ekgi6s7he4J8zO3V4339imWPV3QUs83GOJ7h2lrSQPfZU5gMNoAXZufd7ifKJ3kqzhqHtZWbKOPxf6ampJXbaLow3EI54myxPDmOFwR8DyPYttU9otihoKxrL/wDKzu2XA7o3nc4cuR7D2BXCuNSnKnJxkWaFaNampx0YREXg6hERAEREAREQBERAEREBq4jOY4ZJBa7WOcL82gnNVZBrJrnNDhBBY9rh2ecrPx39Vn+if/hKoCh8Rnd/EcrGHpxm2pFHH4idGCcLZu2avyb8tiaDWNXfuab6zv8AModSRSOEvUaf0jw7rhlifGCReJ/0M+6jWaLxKj6Wo+Ctxowi7x+3QzKmJqVVwzs9OTX0kt9z2YJb/Js8a/yg8bad+a6wwPeyQjo2mzYsukt4niZ+Vdbvl/338aRaPFvqU3wXWSzWfPy2fkVoNcMslovF4o/5dGZxMdm3RNtY/Pc2tB4eaGrDI97pgBG0Xjky6TyXOu87XBeGeJ/0v+7iWRnyp+hn/wAZUa89tt/Q9J25LSXi2f8An+fMydBJv2Gf94ec53+JzliLpYnwvEbAWyhzevtAua1mRtuGy1q2h43u+9nWvLui+m/9eFJRTjb0239BTm4VFJJXXF4tUnvJ/Qln/wAjV37mm+s7/Msc2sutaNowQW7C48becolFuHc37uFYa3xH/wC/npVwlh6aTstP7sXKeOruUbtWbS0395+jIXXa08wD7wsiw03iM9UfBZlnm4cDTuIuw2rA/dOPsb1j9gKrLCHXgj9QK56iFr2OY4Xa5paRzDhYj7VSlJTupppKOXJ0bjsE+Ww5hw55fir/AGfNRqNPmZHbNJyoqS5P5WGORbVO/mBtjsLM1J6LWbC2CJvQyySBjQ/ZAttAWOZ3rgVbxYtte+/uWmBbIZfYr9fCe2kpN2yMbC9pvCwcFG93vp9fsTGHWiz5yjnaOYG0pPgWlVJV5QzAu8x3Vd7jv9iqclbmhOC+F1wmDbQwEFzgLbb97RfjwPdbmFRxOEhRjxKXuNbs/tOpiqjg4e++S+RdCIizzaCIiAIiIAiLl4rjkFM+Js8gZ0ri1pO64F8zwHC5yuRzQHUUBn1mwNe9opZ3bLi0louLtNlO9q4uDfLIjNULQfPfTyfgrGGoqtPhbsUu0MU8NR9olfNIm2Iax4pIpIxSVPXY5oOx5wIVc0ji1jWuinuPNYee0pRTu6oSKpa4kNeCW5GxvZacMEqbylrl99/Iwq3akq8bShks8m8uW3mRpjxs7PRVG4DxOTWt/KvcE9myB0U3Xe9w2WHc8W4qT3S66fp34vkV1i4pdz/p9CPmsbe/QVPj7fiek5/5lqGTr36KawEQHUN/0fNSu6wVVW2Npc91h9p7AOKSo5XctPL8iGJi3wqF28u8908svIjjXjZt0VRx8jm1rfypHLaTa6KfZ6N7D1Dtdd20pLT1LXtDmOuD/ux5LLdPYXs1L5fkn9Uotpw3XefTUj3hTb/I1P1PTe/86wTzX2NmGbqv2jdh/dsjy+opRdYqmpbG0ue6w+PYOZSVHLOXy/IhiVxZQu3f/wBPmraW1I014/dVH1PRaz8iw1VywhsU9z5zD5zn8vSUqpapsjQ5jrj7R2EcCs11DocS72T8vyFilTkrwzT0cny9x34tZkQaB4HU5ADxeQXmXWaPm6Coce0Fv4LhXXy64ft0PEy7+91fAvibVZpjiU4tGyOmaeJ67vZfd7lxG0Ya4ySPdLMc9t5Lj3i+5bNVWNYQC5ocdwJWpNKAC5xyGZVilhaVN35rflz9NChiu0sRVXDpfkufXPLX1MTppHS9FFC+Z+ztFrAXEDnYcMx7wtqHCsQebMoJR6/6Mf8Ana/sUw1U4QWxSVkgs+c2ZfhG05e85+wKePeALkgAbyclnVMdV4nwvI26HY+HUI+0jeVs83r8SsML1dVEpBrZQxl/k4je/e7cPtVj4dQRwRtihYGMaMgPj2ntWthWNwVLpRBIH9E4NcRuuRfLmOF91weS6iqTnKTvJ5mpSpQpx4YJJeQREXg6BERAEREBz8RjqXAiGSNna5jpD7toBQbFtW9RUydJPiO27dnFkByA2rAKyUU3IcU9SvsK0FracWhxVzW+b0e032Auy9irmqp5oaioh2+s2Qlx2fGJ8q3C9l+h1Tus6gMOINlt1J2Wv6bbNcPdsn2ld8NK1RX9Msinjqd6EuFXazzSenk7oizoZXixmNuV7fBeI8Nc03a+x5gELajdYrYWs8LTbu1n6s+b/cK8VaLSW3DHoeI5qgfPNPrNuvfhU/7yP6n+qIuippc38X1K7xEnqo/6x6GKV9Qfn7eq0haMmGucbukueZ2j+K7FNTl5ObWhrS5znGwa0b3E8ls1OGFsLJ2vEkT/ABXDaHva4AjcVxnTouSjJ57XfUt0sRiowc6atFc1GK+iucCGgew3ZLsnsJC32VFQPnWHvavSLpGhCHduve+pwqY2rU79n6xj0PL56g/OsHc1aE1A95u6XaPaSV0USVCE+9d+99RTxtWn3LL0jHpc5keGuabtkseY2h+K3o31A+fv6zbrKvDnWURw8I926976nqeOrT71n6xi/qj14VP+8j+p/qsM1TOcumaPVbZfHyXXle3TT5v4vqeI1pLO0f8AWPQ0ZKJzjcvueZzW9gGCTVdQKWOQ7NtqRxuQxo4kcTewA5nvXh5cXNjjaXSPIaxozJJyBVy6EaNNoqfZNjK+zpXdvmg8gs3Fezp/xhrzzZvdn+2r/wA6j/itFZfFbeVjVhwLEWxtjbiUYa0AC1OMgMh5S5eK6CVtQLTYq5zfN6PZb9UOsfarCRULs1nFFbYTq4qaaTpIMR2HbjaLIjk4bViFOsPjqGi00kb+1rDGfcXELfRLkqKWgREUEhERAEREAREQBR3TnAPDKRzG/KMO3EfSHD2i49qkSID86Ry7w7quBIcDkQRkVsRzjcXN+sp/p3oheTw2CFshHy0B3SAb3ttmH2387D26GDYPhlVHtxwN9JpLgWHkRdaUMfK2aMKr2TBydpNe4iRmb57frBYnV0Y8sE8m9b4Kx4dFqFv9UjPrXd8SutR0VNH4lPGzuY34qXjpckjxHsiku9J/JdSrcPq2kSMfHJsPaWPv1XWJBDm34ggGx3rLG2KKF0UTpHbTg5zn2b4t9lrWtJAHWJvfNSbTjDRfwhm42Eg5HcD+CiG2Oas0owqJVHm/7yKOInVocVBZRfvy9fPn5npFjMgXwzditXM+zMq8ucAsBkK+JclRMjpeSxlF8JUHpLY+rG55LgxjS57jZrQLkk8wtrCsPqKt/R00Zd5zzk1vtVr6I6HQ0Q2yeknI60hG70WDyR9pVDEYxRXDDNmxg+zJTfFVyW3N+u319DS0D0N8FHTz2dUOHeIwfJHbzKmyIsptt3Z9EkkrIIiKCQiIgCIiAIiIAiIgCIiAIiIAobpBoWJJDU0cng9Rxt4knrt59vvCmSKU7ENJ6lZDSSWncI8Rp3Qu3CVo2o39txuXeo62KUXjka8eiQfsUqnga9pa9oc07w4BwPsKildq6oXkuia+B3OF5aPqm4HssvSkcnS2M8jAQWuAIIsQeIPAqDY/ou6Ml8ILo99t5b/MKRv0JrmfIYq+3ASNDvjdeP6P4yDlWQO7TGB+VdqVd03dFbEYNVo2kvR80V0vqmVXoFiEz9p89ODxLWbN+8AZr7DqvqD49aB6rD+Nle/X09mZX7PWvqvn0IWsclQ0b3BWRS6rKcfK1E8nYCGDt4E/BSPDNDKCAgx0rC4eU+8p9heTb2LlLtDwxO9Psbxz+C69CoMNwyqqbeD0z3A+W8bLe/PeprgmrEXD62Yv49HHdre5zt59llZDQBkBZelUqYipU1Zp0MFRo5xWe/M16KkjiYI4o2sYMg1oAA9y2ERcC0EREAREQBERAEREAREQBERAERaeIYnBAAZpo4wd224Nv3XQG4uTpPjApKWSoLS7ZtZoyuSQBnw3rFBpZQvOy2shv2vDfdfeuVrRcDhcpBuCY7EZ+WFKWZDeRu6FaTCvgfJ0fRuY8scL7Q3NcCD3O+xSNV1qU/Vaj6f+GxWKj1EXdBFy67H6SE7MtTExw8kvF/dvSh0hpJiGxVUTnHc0Pbf3XuoFzqIiISEXhzgBcmwG8nJcafS6gYdl1ZFfsdtfC6A7i08VrmwQSTOBIY0uIHG3BeMOxannF4Z45Lb9hwcR3jeFqaZ/s+q+id8EI5HO0I0wFf0oMJjdHY2vtAh17Z2GeRUrVT6kvlKr1Y/i5WjV1ccTC+V7WMG9ziGge0qWRF3RnRYKWpZIxskb2vY4Xa5pDge4hZ1B6CLiV2lVDC4tkqow4ZEA7ZHeG3I9q2MNx6lqMoaiN55Bw2vqnP7EsLnTREQBF4c4AXJsBvJyXNbpFRl4jFXCXk2Dekbck8BnmgOqiIgCIiAIiICF6wtMPA2CKGxneLi+Yjb5xHE8gq5wLRStxFxnc47JOc0pJ2uxg3kD2AL7j7TWY0+MnJ87Yh2NaQ0/irypYGxsbGxoDWgBoHADIL3ojnbieZU9bqnnay8dRG93mlpZfuNyohUVdVTxy0Mhc1hI2on57JBBBZyvbhkV+jlXut/CGPpW1IFpInAE82vNiD3GxHt5qFISglmjxqU/Vaj6f+GxczWHp0/pH0tK8tDTsySNNiTxYw8ANxPO6zar6gxYZXSDe17iO8RMsuBqtwttRX7cmYib0ljxcTYH2E3U2zZF3ZJGXA9WdVOwSSubAHZgPBc83zu5vknsOfNMc1Y1ULC+NzZwBctaC12XENN9ruGauxFHEz17NFQ6vNOHskZSVTy5jiGxvdvY45NY4neCcs9xsrWrKlkUb5JHBrGNLnE8ABclU5rawpsNW2WMbImaXOAy6zTYnvORUi05xV78DgcTnN0Qf22G0feWhGr6EJ2unyIlpHpJVYnOIYmu6NzrRwt8r0pOfPPILs0mqWYsBkqWMdxaGF9uy9xddXU5hTBBJVEAve4safNa3eOy5+AVkI3yQUbq7KZZq5xCCpjdC5hAcCJWv6MtFxe4Oe7gL3VlaYj/AOuqb7+hd8F3FxdM/wBn1X0Tvgovc9cKSdittVGIxU4rJpnhrGsjuTxzdYAcSeS4+keOVOKVTY42OLdq0UQ4em7t4k8Ao/h9HJNI2KJpc95ADRx7TyA5q8tCdEY6GK5s6dw67+XoN5NH2r08szmryVuRu6HYH4FSMgLtp1y554bTszbsVZ6b6by1UppqRzhDfYBjvtTG9srZ7JO4DerG0+rTDh1Q5ps4t2QfXOyfsJUE1N4Wx80s7hcxgNZ2F17kdtslC3Z7fhRr4VqrqXsDpZWQkjJlukI77EAHsF1q49q6q6ZvSxkTNbneMFr228oN3m3Ybq65JA0FziAALknIADeSVUunOsIzbVPRuIjOTpRcF/YziG9u88ETbZEoxSOlq202fK8UlS7aeQeikO91hcsdzNgSDxsp/iuIR08L5pXWYwXJ+AHMk2AHaq71c6CvY9lZUjZLc4o+IJFtt/LI5N96z66a0iGnhF7Pe57u3owAB7339iNJvIlNqNyIYzjlZitQIo2uLSepC3IAedIdx7zkOC72F6qJtpjpqhjQCC5rAXHI3sHG3vspJqowlkVCJrfpJiXOPogkMb3ce8lTdG+SIUE82eWiwAXpEXk6BERAEREBRGkwdR4y6UtybM2Zva0kE/mV3UNWyWNssbg5jgC0jkVG9PtEhXRB0ZDZ477BO5w4sceHYeBVXYfjNfhjzHZzBfOOQXae0fzBXrU534WX8q31wY2xsDaRpvI9we8eaxpuL9pNrdgKjtXrTrHt2WNiYTxaC4+y5WDRvQ+qr5umqNtsZN3yPuHSdjAc/buClRtmw5XVkSrVphLnYVUAj9YdJsXyyDBGD3bTSonq3xZtJXlk3VDwYnE5bLgcr8hcWV20tO2NjWMaGtaA1oHADIBVtrF0EfJI6rpW7RdnLEN5Pns5k8Rx381Cd9SXFq1uRZ6KicH07rqNvROIe1uQbMDdtuF8ismK6wq6paYmWYHZEQglxvwvmR7E4WPaI9608aZUVgjiO02EFlxmHPJ6wHO2Q77qVaaYK9uBxMt1qdsbnDsA2X+7av7Cudq/1fvEjKmrZshpDo4jvuMw9/K3AK0ZYw5pa4AtcCCDxByIKN7EJN3vzK21PY2zo30biA8OL47+UD4wHMg/YVZyo7SzQyoopelpw50IO0x7Ll0foutnlwPJe6HWfWxtDX9HJbi8EH22IUtXzQUrZMu5cXTP9n1X0TvgqrpdM8UqqmPonHxh1I29W189rfla+ZKtPS9pOHVItn0LshnwXm1j0pXTPz9RTyRuEsTnNcwghzeB4XParu0G0xZWx7D7NqGDrN4OHnt7OY4KG6oqJk4rI5GB8bmRgg7t7uPNcjSjRyowyoE0TndHtXilG9voP7fsI9y9PPI8RyzLa01w51RQTxMF3Fl2jmW9YAdptZVnqt0jhpZJmTvDGPaHBx3Asvdp7SN3crK0Lxp1ZRxzvZsuN2utucWmxc3sP81A9PdAZBI+ppGbTHEufG3e0nMlo4tO+3BQtmTLxI5WmOmU1e8QQNe2EmzWDxpTw2gOHo+9THQXQFtPsz1QDpt7W72xfg5/bw4KttH8fkoJHObDGZDleVp2m8wN1l1KjTbE6t4ZE4g3ybA3M95zK9NM8pq92Xoqs13b6Tum/hqxsI6XoIunA6XYbt23bVs1XOu3+qHh+lF+F/0Ztf2H3LxHU6T7pL9Xf7MpvU/EqSKOavmkYZTXFupf3kkKRqGStAiIhIREQBERAFhnpmPFnsa4ekA74rMiA0IsIp2m7aeMHfcMb/Jb6IgCIiA1anD4ZM3xMcfSaD8V8psOhjN44WNPNrQPgttEAREQBaEuEU7jd1PGTzLG/wAlvogMFPTMYLMY1vqgN+CykXyK9IgMFPTMYCGMa0HM7IDfgvU0DXtLXtDmneCLg+wrKiAxRRNY0Na0NaNwAsB3ALKiIDUqcNhkN5IWOPNzQV6paKKP5ONjPVaG/BbKIAteppY5BsyMa8XvZwDs+ea2EQHhrAAABYDcBkvaIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiID/9k=',
        },
        {
          name: 'aws-ecr',
          image: 'https://about.gitlab.com/images/devops-tools/aws-ecr-logo.png',
        },
      ],
      provider: undefined,
      urlData: this.$store.state.url.data,
      urlEnv: this.$store.state.url.env,
      usernameData: this.$store.state.username.data,
      usernameEnv: this.$store.state.username.env,
      passwordData: this.$store.state.password.data,
      passwordEnv: this.$store.state.password.env,
      revealed: false,
      awsEcr: {
        accessKey: 'accessKey',
        secretKey: 'secretKey',
        region: 'region',
      },
    };
  },
  computed: {
    connected () {
      if (this.provider === 'aws-ecr') {
        return (
          this.awsEcr.region?.length > 0 &&
          this.awsEcr.accessKey?.length > 0 &&
          this.awsEcr.secretKey?.length > 0
        );
      }

      return (
        this.urlData &&
        this.urlData.length > 0 &&
        this.usernameData &&
        this.usernameData.length > 0 &&
        this.passwordData &&
        this.passwordData.length > 0
      );
    },
  },
  mounted () {
    if (this.$route.query.error === '401') {
      this.unauthorized();
      this.$router.push('/');
    } else if (this.$route.query.error === 'ENOTFOUND') {
      this.enotfound();
      this.$router.push('/');
    }
  },
  methods: {
    saveData () {
      setCookie(
        'fuzzy-engine-ids',
        btoa(
          JSON.stringify({
            url: {
              data: this.urlData,
            },
            username: {
              data: this.usernameData,
            },
            password: {
              data: this.passwordData,
            },
          }),
        ),
      );

      setCookie(
        'fuzzy-engine-aws-ecr',
        btoa(
          JSON.stringify({
            ...this.awsEcr,
          }),
        ),
      );
    },

    openList (e) {
      e.preventDefault();
      window.location = '/list';
    },

    changeProvider (provider) {
      this.provider = provider;
      setCookie('fuzzy-engine-provider', this.provider);
    },
  },
  notifications: {
    unauthorized: {
      title: 'Error',
      message: '401 - Unauthorized',
      type: 'error',
    },
    enotfound: {
      title: 'Error',
      message: 'Domain not found',
      type: 'error',
    },
  },
};
</script>

<style>
.title {
  font-family: "Quicksand", "Source Sans Pro", -apple-system, BlinkMacSystemFont,
    "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 80px;
  letter-spacing: 1px;
}

.subtitle {
  font-weight: 300;
  font-size: 30px;
  word-spacing: 5px;
  padding-bottom: 15px;
}

.links {
  padding-top: 15px;
}
</style>
